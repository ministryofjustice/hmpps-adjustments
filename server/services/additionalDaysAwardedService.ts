import { Request } from 'express'
import dayjs from 'dayjs'
import AdjudicationClient from '../api/adjudicationsClient'
import { AdjudicationSearchResponse, IndividualAdjudication, Sanction } from '../@types/adjudications/adjudicationTypes'
import { HmppsAuthClient } from '../data'
import { Ada, AdaIntercept, AdasByDateCharged, AdasToReview, ChargeStatus } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'

/* The adjudications status from NOMIS DB mapped to the adjudications API status are listed here temporarily to make it easier to implement the stories which use the NOMIS status
 * 'AS_AWARDED' = 'Activated as Awarded'
 * 'AWARD_RED' = 'Activated with Quantum Reduced'
 * 'IMMEDIATE' = 'Immediate'
 * 'PROSPECTIVE' = 'Prospective'
 * 'QUASHED' = 'Quashed'
 * 'REDAPP' = 'Reduced on Appeal'
 * 'SUSPENDED' = 'Suspended'
 * 'SUSPEN_EXT' = 'Period of Suspension Extended'
 * 'SUSPEN_RED' = 'Period of Suspension Shortened
 * 'SUSP_PROSP' = 'Suspended and Prospective'
 */
const sanctionIsProspective = (s: Sanction) => s.status === 'Prospective' || s.status === 'Suspended and Prospective'

const sanctionIsAda = (s: Sanction) => s.sanctionType === 'Additional Days Added'
const isSanctionedAda = (s: Sanction, hearingDate: Date, startOfSentenceEnvelope: Date) =>
  sanctionIsAda(s) &&
  !sanctionIsProspective(s) &&
  s.sanctionDays > 0 &&
  hearingDate.getTime() >= startOfSentenceEnvelope.getTime()
const isProspectiveAda = (s: Sanction) => sanctionIsAda(s) && sanctionIsProspective(s)

const adaHasSequence = (sequence: number, ada: Ada) => sequence === ada.sequence

function isSuspended(sanction: Sanction) {
  return (
    sanction.status === 'Suspended' ||
    sanction.status === 'Suspended and Prospective' ||
    sanction.status === 'Period of Suspension Extended' ||
    sanction.status === 'Period of Suspension Shortened'
  )
}

function deriveChargeStatus(chargeId: number, sanction: Sanction): ChargeStatus {
  if (isSuspended(sanction)) return 'SUSPENDED'
  if (sanction.status === 'Quashed') return 'QUASHED'
  if (isProspectiveAda(sanction)) return 'PROSPECTIVE'
  return 'AWARDED_OR_PENDING'
}

export default class AdditionalDaysAwardedService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private readonly additionalDaysAwardedStoreService: AdditionalDaysAwardedStoreService,
  ) {}

  public async getAdasToReview(
    nomsId: string,
    startOfSentenceEnvelope: Date,
    username: string,
    token: string,
  ): Promise<AdasToReview> {
    const existingAdasWithChargeIds = (await new AdjustmentsClient(token).findByPerson(nomsId)).filter(
      it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED' && it.additionalDaysAwarded,
    )
    const systemToken = await this.hmppsAuthClient.getSystemClientToken(username)
    const adjudicationClient = new AdjudicationClient(systemToken)
    const adjudications: AdjudicationSearchResponse = await adjudicationClient.getAdjudications(nomsId)
    const individualAdjudications = await Promise.all(
      adjudications.results.content.map(async it => {
        return adjudicationClient.getAdjudication(nomsId, it.adjudicationNumber)
      }),
    )
    const adas: Ada[] = this.getAdas(individualAdjudications, startOfSentenceEnvelope)

    const awardedOrPending: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'AWARDED_OR_PENDING')
    const { awarded, awaitingApproval } = this.filterAdasByMatchingAdjustment(
      awardedOrPending,
      existingAdasWithChargeIds,
    )

    const totalAwarded: number = this.getTotalDays(awarded)
    const totalAwaitingApproval: number = this.getTotalDays(awaitingApproval)

    const suspended: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'SUSPENDED')
    const totalSuspended: number = this.getTotalDays(suspended)

    const quashed: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'QUASHED')
    const totalQuashed: number = this.getTotalDays(quashed)

    return {
      totalAwarded,
      awarded,
      totalSuspended,
      suspended,
      awaitingApproval,
      totalAwaitingApproval,
      quashed,
      totalQuashed,
    } as AdasToReview
  }

  private filterAdasByMatchingAdjustment(
    adas: AdasByDateCharged[],
    adjustments: Adjustment[],
  ): { awarded: AdasByDateCharged[]; awaitingApproval: AdasByDateCharged[] } {
    const result = { awarded: [], awaitingApproval: [] } as {
      awarded: AdasByDateCharged[]
      awaitingApproval: AdasByDateCharged[]
    }

    adas.forEach(it => {
      const adjustment = adjustments.find(adj => this.adjustmentMatchesAdjudication(it, adj))
      if (adjustment) {
        result.awarded.push({ ...it, status: 'AWARDED', adjustmentId: adjustment.id })
      } else {
        result.awaitingApproval.push({ ...it, status: 'PENDING APPROVAL' })
      }
    })
    return result
  }

  private adjustmentMatchesAdjudication(adjudication: AdasByDateCharged, adjustment: Adjustment): boolean {
    return (
      adjudication.total === adjustment.days &&
      adjudication.dateChargeProved.toISOString().substring(0, 10) === adjustment.fromDate &&
      JSON.stringify(adjudication.charges.map(charge => charge.chargeNumber).sort()) ===
        JSON.stringify(adjustment.additionalDaysAwarded.adjudicationId.sort())
    )
  }

  private getTotalDays(adas: AdasByDateCharged[]) {
    return adas.reduce((acc, cur) => acc + cur.total, 0)
  }

  private getAdasByDateCharged(adas: Ada[], filterStatus: ChargeStatus): AdasByDateCharged[] {
    const adasByDateCharged = adas
      .filter(it => it.status === filterStatus)
      .reduce((acc: AdasByDateCharged[], cur) => {
        if (acc.some(it => it.dateChargeProved.getTime() === cur.dateChargeProved.getTime())) {
          const record = acc.find(it => it.dateChargeProved.getTime() === cur.dateChargeProved.getTime())
          record.charges.push(cur)
        } else {
          acc.push({ dateChargeProved: cur.dateChargeProved, charges: [cur] } as AdasByDateCharged)
        }
        return acc
      }, [])
      .sort((a, b) => a.dateChargeProved.getTime() - b.dateChargeProved.getTime())

    return this.associateConsecutiveAdas(adasByDateCharged, adas).map(it => {
      return {
        ...it,
        total: this.calculateTotal(it),
        status: filterStatus !== 'AWARDED_OR_PENDING' ? filterStatus : undefined,
      }
    })
  }

  private calculateTotal(adaByDateCharge: AdasByDateCharged): number {
    if (adaByDateCharge.charges.length === 1) {
      return adaByDateCharge.charges[0].days
    }
    const baseCharges = adaByDateCharge.charges.filter(it => !it.consecutiveToSequence)
    const consecCharges = adaByDateCharge.charges.filter(it => !!it.consecutiveToSequence)

    const chains: Ada[][] = []

    baseCharges.forEach(it => {
      const chain = [it]
      chains.push(chain)
      this.createChain(it, chain, consecCharges)
    })

    const calculatedDays = chains
      .filter(it => it.length > 0)
      .map(chain => chain.reduce((acc, cur) => acc + cur.days, 0))
    if (!calculatedDays.length) {
      return 0
    }
    return Math.max(...calculatedDays)
  }

  private createChain(ada: Ada, chain: Ada[], consecCharges: Ada[]) {
    const consecFrom = consecCharges.find(it => it.consecutiveToSequence === ada.sequence)
    if (consecFrom) {
      chain.push(consecFrom)
      this.createChain(consecFrom, chain, consecCharges)
    }
  }

  /*
   * Sets the toBeServed of the groupedAdas for the review screen, can be either Consecutive, Concurrent or Forthwith
   */
  private associateConsecutiveAdas(adasByDateCharged: AdasByDateCharged[], adas: Ada[]): AdasByDateCharged[] {
    const consecutiveSourceAdas = this.getSourceAdaForConsecutive(adas)
    return adasByDateCharged.map(it => {
      const { charges } = it
      // Only one charge in group
      if (charges.length === 1) {
        return { ...it, charges: [{ ...charges[0], toBeServed: 'Forthwith' } as Ada] }
      }

      // Label consecutive or concurrent adas
      const consecutiveAndConcurrentCharges = charges.map(charge => {
        if (this.validConsecutiveSequence(charge, consecutiveSourceAdas)) {
          const consecutiveAda = consecutiveSourceAdas.find(c => adaHasSequence(charge.consecutiveToSequence, c))
          return { ...charge, toBeServed: `Consecutive to ${consecutiveAda.chargeNumber}` } as Ada
        }

        if (
          !this.validConsecutiveSequence(charge, consecutiveSourceAdas) &&
          !this.isSourceForConsecutiveChain(consecutiveSourceAdas, charge)
        ) {
          return { ...charge, toBeServed: 'Concurrent' } as Ada
        }

        return { ...charge, toBeServed: 'Forthwith' } as Ada
      })

      return {
        ...it,
        charges: this.sortChargesSoThatForthwithIsFirst(consecutiveAndConcurrentCharges),
      }
    })
  }

  private sortChargesSoThatForthwithIsFirst(charges: Ada[]): Ada[] {
    return charges.sort((a, b) => {
      if (a.toBeServed === 'Forthwith') {
        return -1
      }
      if (b.toBeServed === 'Forthwith') {
        return 1
      }
      return 0
    })
  }

  private isSourceForConsecutiveChain(consecutiveSourceAdas: Ada[], charge: Ada) {
    return consecutiveSourceAdas.some(consecutiveAda => adaHasSequence(charge.sequence, consecutiveAda))
  }

  private validConsecutiveSequence(charge: Ada, consecutiveSourceAdas: Ada[]) {
    return (
      charge.consecutiveToSequence &&
      consecutiveSourceAdas.some(consecutiveAda => adaHasSequence(charge.consecutiveToSequence, consecutiveAda))
    )
  }

  private getAdas(individualAdjudications: Awaited<IndividualAdjudication>[], startOfSentenceEnvelope: Date): Ada[] {
    const adasToTransform = individualAdjudications.filter(ad =>
      ad.hearings.some(h => {
        const hearingDate = new Date(h.hearingTime.substring(0, 10))
        return h.results.some(r =>
          r.sanctions.some(s => isProspectiveAda(s) || isSanctionedAda(s, hearingDate, startOfSentenceEnvelope)),
        )
      }),
    )

    adasToTransform.map(a => a.hearings) // chech reliability of consecutive to sequence.. for a given set of adjudocations, where does the consec seq sit?
    return adasToTransform.reduce((acc: Ada[], cur) => {
      cur.hearings
        .filter(h => {
          const hearingDate = new Date(h.hearingTime.substring(0, 10))
          return h.results.some(r =>
            r.sanctions.some(s => isProspectiveAda(s) || isSanctionedAda(s, hearingDate, startOfSentenceEnvelope)),
          )
        })
        .forEach(hearing => {
          const hearingDate = new Date(hearing.hearingTime.substring(0, 10))
          const result = hearing.results.find(r =>
            r.sanctions.some(s => isProspectiveAda(s) || isSanctionedAda(s, hearingDate, startOfSentenceEnvelope)),
          )
          result.sanctions
            .filter(s => isProspectiveAda(s) || isSanctionedAda(s, hearingDate, startOfSentenceEnvelope))
            .forEach(sanction => {
              const ada = {
                dateChargeProved: new Date(hearing.hearingTime.substring(0, 10)),
                chargeNumber: cur.adjudicationNumber,
                heardAt: hearing.establishment,
                status: deriveChargeStatus(cur.adjudicationNumber, sanction),
                days: sanction.sanctionDays,
                sequence: sanction.sanctionSeq,
                consecutiveToSequence: sanction.consecutiveSanctionSeq,
              } as Ada
              acc.push(ada)
            })
        })
      return acc
    }, [])
  }

  private getSourceAdaForConsecutive(allAdas: Ada[]): Ada[] {
    return allAdas
      .filter(
        ada => ada.consecutiveToSequence && allAdas.some(sourceAda => sourceAda.sequence === ada.consecutiveToSequence),
      )
      .map(consecutiveAda => allAdas.find(sourceAda => sourceAda.sequence === consecutiveAda.consecutiveToSequence))
  }

  public async shouldIntercept(
    req: Request,
    prisonerDetail: PrisonApiPrisoner,
    adjustments: Adjustment[],
    startOfSentenceEnvelope: Date,
    username: string,
  ): Promise<AdaIntercept> {
    const allAdaAdjustments = adjustments.filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')
    const anyUnlinkedAda = allAdaAdjustments.some(it => !it.additionalDaysAwarded?.adjudicationId?.length)
    const anyLinkedAda = allAdaAdjustments.some(it => !!it.additionalDaysAwarded?.adjudicationId?.length)

    const systemToken = await this.hmppsAuthClient.getSystemClientToken(username)
    const adjudicationClient = new AdjudicationClient(systemToken)
    const adjudications: AdjudicationSearchResponse = await adjudicationClient.getAdjudications(
      prisonerDetail.offenderNo,
    )
    const individualAdjudications = await Promise.all(
      adjudications.results.content.map(async it => {
        return adjudicationClient.getAdjudication(prisonerDetail.offenderNo, it.adjudicationNumber)
      }),
    )
    const existingAdasWithChargeIds = allAdaAdjustments.filter(it => it.additionalDaysAwarded)
    const adas: Ada[] = this.getAdas(individualAdjudications, startOfSentenceEnvelope)

    const awardedOrPending: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'AWARDED_OR_PENDING')
    const { awaitingApproval } = this.filterAdasByMatchingAdjustment(awardedOrPending, existingAdasWithChargeIds)
    const prospective: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'PROSPECTIVE')
    if (allAdaAdjustments.length && anyUnlinkedAda) {
      return {
        type: 'FIRST_TIME',
        number: prospective.length + awaitingApproval.length,
      }
    }

    if (awaitingApproval.length) {
      if (anyLinkedAda) {
        return { type: 'UPDATE', number: awaitingApproval.length }
      }
      return { type: 'FIRST_TIME', number: awaitingApproval.length }
    }

    if (prospective.length) {
      const lastApproved = this.additionalDaysAwardedStoreService.get(req, prisonerDetail.offenderNo)
      if (lastApproved && dayjs(lastApproved).add(1, 'hour').isAfter(dayjs())) {
        return { type: 'NONE', number: 0 }
      }
      return {
        type: 'PADA',
        number: prospective.length,
      }
    }
    return { type: 'NONE', number: 0 }
  }

  public async approveAdjudications(
    req: Request,
    prisonerDetail: PrisonApiPrisoner,
    startOfSentenceEnvelope: Date,
    username: string,
    token: string,
  ) {
    const allAdaAdjustments = (await new AdjustmentsClient(token).findByPerson(prisonerDetail.offenderNo)).filter(
      it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED',
    )
    const systemToken = await this.hmppsAuthClient.getSystemClientToken(username)
    const adjudicationClient = new AdjudicationClient(systemToken)
    const adjudications: AdjudicationSearchResponse = await adjudicationClient.getAdjudications(
      prisonerDetail.offenderNo,
    )
    const individualAdjudications = await Promise.all(
      adjudications.results.content.map(async it => {
        return adjudicationClient.getAdjudication(prisonerDetail.offenderNo, it.adjudicationNumber)
      }),
    )
    const existingAdasWithChargeIds = allAdaAdjustments.filter(it => it.additionalDaysAwarded)
    const adas: Ada[] = this.getAdas(individualAdjudications, startOfSentenceEnvelope)

    const awardedOrPending: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'AWARDED_OR_PENDING')

    const { awarded, awaitingApproval } = this.filterAdasByMatchingAdjustment(
      awardedOrPending,
      existingAdasWithChargeIds,
    )

    const adjustments = awaitingApproval.map(it => {
      return {
        person: prisonerDetail.offenderNo,
        bookingId: prisonerDetail.bookingId,
        adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
        fromDate: it.dateChargeProved.toISOString().substring(0, 10),
        days: it.total,
        prisonId: prisonerDetail.agencyId,
        additionalDaysAwarded: { adjudicationId: it.charges.map(charge => charge.chargeNumber) },
      } as Adjustment
    })

    const awardedIds = awarded.map(it => it.adjustmentId)
    // Delete all ADAs which were not in the awarded table.
    await Promise.all(
      allAdaAdjustments
        .filter(it => awardedIds.indexOf(it.id) === -1)
        .map(it => {
          return new AdjustmentsClient(token).delete(it.id)
        }),
    )
    // Create adjustments
    await Promise.all(
      adjustments.map(it => {
        return new AdjustmentsClient(token).create(it)
      }),
    )

    this.additionalDaysAwardedStoreService.approve(req, prisonerDetail.offenderNo)
  }
}

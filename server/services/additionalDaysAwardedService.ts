import { Request } from 'express'
import dayjs from 'dayjs'
import { HmppsAuthClient } from '../data'
import {
  Ada,
  AdaIntercept,
  AdasByDateCharged,
  AdasToReview,
  AdasToView,
  ChargeStatus,
  PadasToReview,
} from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'
import {
  PrisonApiAdjudicationSearchResponse,
  PrisonApiIndividualAdjudication,
  PrisonApiPrisoner,
  PrisonApiSanction,
} from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import PadaForm from '../model/padaForm'
import ReviewAndSubmitAdaViewModel from '../model/reviewAndSubmitAdaViewModel'
import PrisonApiClient from '../api/prisonApiClient'

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
const sanctionIsProspective = (s: PrisonApiSanction) =>
  s.status === 'Prospective' || s.status === 'Suspended and Prospective'

const sanctionIsAda = (s: PrisonApiSanction) => s.sanctionType === 'Additional Days Added'
const isSanctionedAda = (s: PrisonApiSanction, hearingDate: Date, startOfSentenceEnvelope: Date) =>
  sanctionIsAda(s) &&
  !sanctionIsProspective(s) &&
  s.sanctionDays > 0 &&
  hearingDate.getTime() >= startOfSentenceEnvelope.getTime()
const isProspectiveAda = (s: PrisonApiSanction) => sanctionIsAda(s) && sanctionIsProspective(s)

const adaHasSequence = (sequence: number, ada: Ada) => sequence === ada.sequence

function isSuspended(sanction: PrisonApiSanction) {
  return (
    sanction.status === 'Suspended' ||
    sanction.status === 'Suspended and Prospective' ||
    sanction.status === 'Period of Suspension Extended' ||
    sanction.status === 'Period of Suspension Shortened'
  )
}

function deriveChargeStatus(chargeId: number, sanction: PrisonApiSanction): ChargeStatus {
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

  public async viewAdjustments(nomsId: string, startOfSentenceEnvelope: Date, token: string): Promise<AdasToView> {
    const allAdaAdjustments = (await new AdjustmentsClient(token).findByPerson(nomsId)).filter(
      it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED',
    )
    const existingAdasWithChargeIds = allAdaAdjustments.filter(it => it.additionalDaysAwarded)
    const adas: Ada[] = await this.lookupAdas(token, nomsId, startOfSentenceEnvelope)
    const awardedOrPending: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'AWARDED_OR_PENDING')
    let { awarded } = this.filterAdasByMatchingAdjustment(awardedOrPending, existingAdasWithChargeIds)
    const allProspective: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'PROSPECTIVE')
    const { awarded: prospectiveAwarded } = this.filterAdasByMatchingAdjustment(
      allProspective,
      existingAdasWithChargeIds,
    )

    awarded = awarded.concat(prospectiveAwarded)
    const totalAwarded: number = this.getTotalDays(awarded)

    return { awarded, totalAwarded }
  }

  public async getAdasToApprove(
    req: Request,
    nomsId: string,
    startOfSentenceEnvelope: Date,
    token: string,
  ): Promise<AdasToReview> {
    const allAdaAdjustments = (await new AdjustmentsClient(token).findByPerson(nomsId)).filter(
      it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED',
    )
    const adas: Ada[] = await this.lookupAdas(token, nomsId, startOfSentenceEnvelope)

    const awardedOrPending: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'AWARDED_OR_PENDING')
    let { awarded, awaitingApproval } = this.filterAdasByMatchingAdjustment(awardedOrPending, allAdaAdjustments)

    const suspended: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'SUSPENDED')
    const totalSuspended: number = this.getTotalDays(suspended)

    const allQuashed: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'QUASHED')
    const quashed = this.filterQuashedAdasByMatchingChargeIds(allQuashed, allAdaAdjustments)
    const totalQuashed: number = this.getTotalDays(quashed)

    const allProspective: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'PROSPECTIVE')
    const { awarded: prospectiveAwarded, awaitingApproval: prospective } = this.filterAdasByMatchingAdjustment(
      allProspective,
      allAdaAdjustments,
    )

    awarded = awarded.concat(prospectiveAwarded)

    const selectedProspectiveAdaDates = this.additionalDaysAwardedStoreService.getSelectedPadas(req, nomsId)
    const selectedProspectiveAdas = prospective.filter(it => {
      return selectedProspectiveAdaDates.includes(it.dateChargeProved.toISOString().substring(0, 10))
    })
    awaitingApproval = awaitingApproval.concat(selectedProspectiveAdas)

    const totalAwarded: number = this.getTotalDays(awarded)
    const totalAwaitingApproval: number = this.getTotalDays(awaitingApproval)
    return {
      totalAwarded,
      awarded,
      totalSuspended,
      suspended,
      awaitingApproval,
      totalAwaitingApproval,
      quashed,
      totalQuashed,
      intercept: this.shouldInterceptLogic(req, nomsId, allAdaAdjustments, prospective, awaitingApproval, quashed),
    } as AdasToReview
  }

  public async getPadasToApprove(nomsId: string, startOfSentenceEnvelope: Date, token: string): Promise<PadasToReview> {
    const allAdaAdjustments = (await new AdjustmentsClient(token).findByPerson(nomsId)).filter(
      it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED',
    )
    const adas: Ada[] = await this.lookupAdas(token, nomsId, startOfSentenceEnvelope)

    const allProspective: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'PROSPECTIVE')
    const { awaitingApproval: prospective } = this.filterAdasByMatchingAdjustment(allProspective, allAdaAdjustments)
    const totalProspective: number = this.getTotalDays(prospective)

    return {
      prospective,
      totalProspective,
    } as PadasToReview
  }

  public storeSelectedPadas(req: Request, nomsId: string, padaForm: PadaForm): void {
    this.additionalDaysAwardedStoreService.storeSelectedPadas(req, nomsId, padaForm.getSelectedProspectiveAdas())
  }

  private filterQuashedAdasByMatchingChargeIds(
    adas: AdasByDateCharged[],
    adjustments: Adjustment[],
  ): AdasByDateCharged[] {
    const chargeIds = adjustments
      .filter(it => it.additionalDaysAwarded)
      .flatMap(it => it.additionalDaysAwarded.adjudicationId)
    return adas
      .filter(adaByDate => {
        return adaByDate.charges.some(it => chargeIds.includes(it.chargeNumber))
      })
      .map(it => {
        return { ...it, status: 'PENDING APPROVAL' }
      })
  }

  private filterAdasByMatchingAdjustment(
    adas: AdasByDateCharged[],
    adjustments: Adjustment[],
  ): { awarded: AdasByDateCharged[]; awaitingApproval: AdasByDateCharged[] } {
    const result = { awarded: [], awaitingApproval: [] } as {
      awarded: AdasByDateCharged[]
      awaitingApproval: AdasByDateCharged[]
    }

    if (adjustments.some(it => !it.additionalDaysAwarded)) {
      // An ADA has been created in NOMIS, Revert everything to pending approval
      result.awaitingApproval = adas.map(it => {
        return { ...it, status: 'PENDING APPROVAL' }
      })
      return result
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
      adjudication.total === (adjustment.days || adjustment.daysBetween || adjustment.effectiveDays) &&
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

  private getAdas(
    individualAdjudications: Awaited<PrisonApiIndividualAdjudication>[],
    startOfSentenceEnvelope: Date,
  ): Ada[] {
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
    token: string,
  ): Promise<AdaIntercept> {
    if (!startOfSentenceEnvelope) {
      return { type: 'NONE', anyProspective: false, number: 0 }
    }
    const allAdaAdjustments = adjustments.filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')

    const adas: Ada[] = await this.lookupAdas(token, prisonerDetail.offenderNo, startOfSentenceEnvelope)

    const awardedOrPending: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'AWARDED_OR_PENDING')
    const { awaitingApproval } = this.filterAdasByMatchingAdjustment(awardedOrPending, allAdaAdjustments)
    const allProspective: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'PROSPECTIVE')
    const { awaitingApproval: prospective } = this.filterAdasByMatchingAdjustment(allProspective, allAdaAdjustments)
    const allQuashed: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'QUASHED')
    const quashed = this.filterQuashedAdasByMatchingChargeIds(allQuashed, allAdaAdjustments)

    return this.shouldInterceptLogic(
      req,
      prisonerDetail.offenderNo,
      allAdaAdjustments,
      prospective,
      awaitingApproval,
      quashed,
    )
  }

  private shouldInterceptLogic(
    req: Request,
    nomsId: string,
    allAdaAdjustments: Adjustment[],
    prospective: AdasByDateCharged[],
    awaitingApproval: AdasByDateCharged[],
    quashed: AdasByDateCharged[],
  ): AdaIntercept {
    const anyUnlinkedAda = allAdaAdjustments.some(
      it => !it.additionalDaysAwarded?.adjudicationId?.length && it.effectiveDays > 0,
    )

    if (anyUnlinkedAda) {
      return {
        type: 'FIRST_TIME',
        number: prospective.length + awaitingApproval.length,
        anyProspective: !!prospective.length,
      }
    }

    if (awaitingApproval.length) {
      return { type: 'UPDATE', number: awaitingApproval.length, anyProspective: !!prospective.length }
    }

    if (quashed.length) {
      return { type: 'UPDATE', number: quashed.length, anyProspective: !!prospective.length }
    }

    if (prospective.length) {
      if (req) {
        const lastApproved = this.additionalDaysAwardedStoreService.getLastApprovedDate(req, nomsId)
        if (lastApproved && dayjs(lastApproved).add(1, 'hour').isAfter(dayjs())) {
          return { type: 'NONE', number: 0, anyProspective: false }
        }
      }
      return {
        type: 'PADA',
        number: prospective.length,
        anyProspective: !!prospective.length,
      }
    }
    return { type: 'NONE', number: 0, anyProspective: false }
  }

  private async getAdasToSubmitAndDelete(
    req: Request,
    prisonerDetail: PrisonApiPrisoner,
    startOfSentenceEnvelope: Date,
    token: string,
  ): Promise<{
    adjustmentsToCreate: Adjustment[]
    awarded: AdasByDateCharged[]
    allAdaAdjustments: Adjustment[]
    quashed: AdasByDateCharged[]
  }> {
    const allAdaAdjustments = (await new AdjustmentsClient(token).findByPerson(prisonerDetail.offenderNo)).filter(
      it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED',
    )
    const adas: Ada[] = await this.lookupAdas(token, prisonerDetail.offenderNo, startOfSentenceEnvelope)

    const awardedOrPending: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'AWARDED_OR_PENDING')

    let { awarded, awaitingApproval } = this.filterAdasByMatchingAdjustment(awardedOrPending, allAdaAdjustments)

    const allProspective: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'PROSPECTIVE')
    const { awarded: prospectiveAwarded, awaitingApproval: prospective } = this.filterAdasByMatchingAdjustment(
      allProspective,
      allAdaAdjustments,
    )

    awarded = awarded.concat(prospectiveAwarded)

    const selectedProspectiveAdaDates = this.additionalDaysAwardedStoreService.getSelectedPadas(
      req,
      prisonerDetail.offenderNo,
    )
    const selectedProspectiveAdas = prospective.filter(it => {
      return selectedProspectiveAdaDates.includes(it.dateChargeProved.toISOString().substring(0, 10))
    })
    awaitingApproval = awaitingApproval.concat(selectedProspectiveAdas)

    const allQuashed: AdasByDateCharged[] = this.getAdasByDateCharged(adas, 'QUASHED')
    const quashed = this.filterQuashedAdasByMatchingChargeIds(allQuashed, allAdaAdjustments)

    return {
      awarded,
      allAdaAdjustments,
      adjustmentsToCreate: awaitingApproval.map(it => {
        return {
          person: prisonerDetail.offenderNo,
          bookingId: prisonerDetail.bookingId,
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          fromDate: it.dateChargeProved.toISOString().substring(0, 10),
          days: it.total,
          prisonId: prisonerDetail.agencyId,
          additionalDaysAwarded: {
            adjudicationId: it.charges.map(charge => charge.chargeNumber),
            prospective: it.charges.some(charge => charge.status === 'PROSPECTIVE'),
          },
        } as Adjustment
      }),
      quashed,
    }
  }

  public async getReviewAndSubmitModel(
    req: Request,
    prisonerDetail: PrisonApiPrisoner,
    startOfSentenceEnvelope: Date,
    token: string,
  ): Promise<ReviewAndSubmitAdaViewModel> {
    const { adjustmentsToCreate, allAdaAdjustments, quashed } = await this.getAdasToSubmitAndDelete(
      req,
      prisonerDetail,
      startOfSentenceEnvelope,
      token,
    )

    const quashedAdjustments = quashed.map(it => {
      return allAdaAdjustments.find(adjustment => this.adjustmentMatchesAdjudication(it, adjustment))
    })
    return new ReviewAndSubmitAdaViewModel(prisonerDetail, adjustmentsToCreate, allAdaAdjustments, quashedAdjustments)
  }

  public async submitAdjustments(
    req: Request,
    prisonerDetail: PrisonApiPrisoner,
    startOfSentenceEnvelope: Date,
    token: string,
  ) {
    const { awarded, adjustmentsToCreate, allAdaAdjustments } = await this.getAdasToSubmitAndDelete(
      req,
      prisonerDetail,
      startOfSentenceEnvelope,
      token,
    )

    const awardedIds = awarded.map(it => it.adjustmentId)
    // Delete all ADAs which were not in the awarded table.
    await Promise.all(
      allAdaAdjustments
        .filter(it => awardedIds.indexOf(it.id) === -1)
        .map(it => {
          return new AdjustmentsClient(token).delete(it.id)
        }),
    )
    if (adjustmentsToCreate.length) {
      // Create adjustments
      await new AdjustmentsClient(token).create(adjustmentsToCreate)
    }

    this.additionalDaysAwardedStoreService.setLastApprovedDate(req, prisonerDetail.offenderNo)
    this.additionalDaysAwardedStoreService.clearSelectedPadas(req, prisonerDetail.offenderNo)
  }

  private async lookupAdas(token: string, nomsId: string, startOfSentenceEnvelope: Date) {
    const adjudicationClient = new PrisonApiClient(token)
    const adjudications: PrisonApiAdjudicationSearchResponse = await adjudicationClient.getAdjudications(nomsId)
    const individualAdjudications = await Promise.all(
      adjudications.results.map(async it => {
        return adjudicationClient.getAdjudication(nomsId, it.adjudicationNumber)
      }),
    )
    return this.getAdas(individualAdjudications, startOfSentenceEnvelope)
  }
}

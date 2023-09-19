import AdjudicationClient from '../api/adjudicationsClient'
import { AdjudicationSearchResponse, IndividualAdjudication, Sanction } from '../@types/adjudications/adjudicationTypes'
import { HmppsAuthClient } from '../data'
import { Ada, AdasByDateCharged, AdasToReview } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'

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

const AWARDED = 'AWARDED'
const SUSPENDED = 'SUSPENDED'
const QUASHED = 'QUASHED'
const AWAITING_APPROVAL = 'AWAITING APPROVAL'

function deriveStatus(chargeId: number, sanction: Sanction, existingAdaChargeIds: number[]) {
  if (isSuspended(sanction)) return SUSPENDED
  if (sanction.status === 'Quashed' && existingAdaChargeIds.some(it => it === chargeId)) return AWAITING_APPROVAL
  if (sanction.status === 'Quashed') return QUASHED
  if (!isSuspended(sanction) && existingAdaChargeIds.some(it => it === chargeId)) return AWARDED
  return AWAITING_APPROVAL
}

export default class AdditionalDaysAwardedService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async getAdasToReview(
    nomsId: string,
    startOfSentenceEnvelope: Date,
    username: string,
    token: string,
  ): Promise<AdasToReview> {
    const existingAdaChargeIds = (await new AdjustmentsClient(token).findByPerson(nomsId))
      .filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED' && it.additionalDaysAwarded)
      .map(ada => ada.additionalDaysAwarded.adjudicationId)
    const systemToken = await this.hmppsAuthClient.getSystemClientToken(username)
    const adjudicationClient = new AdjudicationClient(systemToken)
    const adjudications: AdjudicationSearchResponse = await adjudicationClient.getAdjudications(nomsId)
    const individualAdjudications = await Promise.all(
      adjudications.results.content.map(async it => {
        return adjudicationClient.getAdjudication(nomsId, it.adjudicationNumber)
      }),
    )
    const allAdas: Ada[] = this.getAdas(individualAdjudications, startOfSentenceEnvelope, existingAdaChargeIds)

    const adas: AdasByDateCharged[] = this.getAdasByDateCharged(allAdas, AWARDED)

    // const adas = this.getAdasByConsecutiveToSequence(allAdas)
    const totalAdas: number = this.getTotalDaysByStatus(allAdas, AWARDED)

    const suspended: AdasByDateCharged[] = this.getAdasByDateCharged(allAdas, SUSPENDED)
    const totalSuspended: number = this.getTotalDaysByStatus(allAdas, SUSPENDED)

    const awaitingApproval: AdasByDateCharged[] = this.getAdasByDateCharged(allAdas, AWAITING_APPROVAL)
    const totalAwaitingApproval: number = this.getTotalDaysByStatus(allAdas, AWAITING_APPROVAL)

    return {
      totalAdas,
      adas,
      totalSuspended,
      suspended,
      awaitingApproval,
      totalAwaitingApproval,
    } as AdasToReview
  }

  private getTotalDaysByStatus(allAdas: Ada[], status: string) {
    return allAdas.filter(it => it.status === status).reduce((acc, cur) => acc + cur.days, 0)
  }

  private getAdasByDateChargedOld(adas: Ada[], filterStatus: string) {
    return adas
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
  }

  private getAdasByDateCharged(adas: Ada[], filterStatus: string): AdasByDateCharged[] {
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

    return this.associateConsecutiveAdas(adasByDateCharged, adas)
  }

  /*
   * Sets the toBeServed of the groupedAdas for the review screen, can be either Consecutive, Concurrent or Forthwith
   */
  private associateConsecutiveAdas(adasByDateCharged: AdasByDateCharged[], adas: Ada[]) {
    const consecutiveSourceAdas = this.getSourceAdaForConsecutive(adas)
    return adasByDateCharged.map(it => {
      const { charges } = it
      // Only one charge in group
      if (charges.length === 1) {
        return { ...it, charges: [{ ...charges[0], toBeServed: 'Forthwith' } as Ada] }
      }

      // Label consecutive or concurrent
      const consecutiveAndConcurrentCharges = charges.map(charge => {
        if (charge.consecutiveToSequence) {
          return {
            ...charge,
            toBeServed: `Consecutive to ${
              consecutiveSourceAdas.find(consecutiveAda => adaHasSequence(charge.consecutiveToSequence, consecutiveAda))
                .chargeNumber
            }`,
          } as Ada
        }

        if (
          !charge.consecutiveToSequence &&
          !consecutiveSourceAdas.some(consecutiveAda => adaHasSequence(charge.sequence, consecutiveAda))
        ) {
          return {
            ...charge,
            toBeServed: 'Concurrent',
          } as Ada
        }

        return {
          ...charge,
          toBeServed: 'Forthwith',
        } as Ada
      })

      return { ...it, charges: consecutiveAndConcurrentCharges }
    })
  }

  private getAdas(
    individualAdjudications: Awaited<IndividualAdjudication>[],
    startOfSentenceEnvelope: Date,
    existingAdaChargeIds: number[],
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
                toBeServed: 'TODO', // TODO this field to be populated in a subsequent story
                heardAt: hearing.establishment,
                status: deriveStatus(cur.adjudicationNumber, sanction, existingAdaChargeIds),
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
      .filter(ada => ada.consecutiveToSequence)
      .map(consecutiveAda => allAdas.find(sourceAda => sourceAda.sequence === consecutiveAda.consecutiveToSequence))
  }
}

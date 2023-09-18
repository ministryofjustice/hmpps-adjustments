import AdjudicationClient from '../api/adjudicationsClient'
import { AdjudicationSearchResponse, IndividualAdjudication, Sanction } from '../@types/adjudications/adjudicationTypes'
import { HmppsAuthClient } from '../data'
import { Ada, AdasByDateCharged, AdasToReview } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'

/* The adjudications status from NOMIS DB mapped to the adjudications API status (listed here temporarily to make it easier to implement the stories which use the NOMIS status)
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
      .filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')
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

  private getAdasByDateCharged(adas: Ada[], filterStatus: string) {
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
              } as Ada
              acc.push(ada)
            })
        })
      return acc
    }, [])
  }
}

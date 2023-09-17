import AdjudicationClient from '../api/adjudicationsClient'
import { AdjudicationSearchResponse, IndividualAdjudication, Sanction } from '../@types/adjudications/adjudicationTypes'
import { HmppsAuthClient } from '../data'
import { Ada, AdasByDateCharged, AdasToReview } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

// 'AS_AWARDED', null, null, 'Activated as Awarded', 3, 'Y',
//     'AWARD_RED', null, null, 'Activated with Quantum Reduced'
// 'IMMEDIATE', null, null, 'Immediate', 1, 'Y', 'N', null);
// 'PROSPECTIVE', null, null, 'Prospective', 7, 'Y', 'N', nu
// 'QUASHED', null, null, 'Quashed', 9, 'Y', 'N', null);
// 'REDAPP', null, null, 'Reduced on Appeal', 10, 'Y', 'N',
//     'SUSPENDED', null, null, 'Suspended', 2, 'Y', 'N', null);
// 'SUSPEN_EXT', null, null, 'Period of Suspension Extended'
// 'SUSPEN_RED', null, null, 'Period of Suspension Shortened
// 'SUSP_PROSP', null, null, 'Suspended and Prospective', 8,
const sanctionIsProspective = (s: Sanction) => s.status === 'Prospective' || s.status === 'Suspended and Prospective'

const isSanctionSuspended = (s: Sanction) =>
  s.status === 'Quashed' ||
  s.status === 'Suspended' ||
  s.status === 'Suspended and Prospective' ||
  s.status === 'Period of Suspension Extended' ||
  s.status === 'Period of Suspension Shortened'
const sanctionIsAda = (s: Sanction) => s.sanctionType === 'Additional Days Added'
const isSanctionedAda = (s: Sanction) => sanctionIsAda(s) && !sanctionIsProspective(s)
const isProspectiveAda = (s: Sanction) => sanctionIsAda(s) && sanctionIsProspective(s)

const isAwaitingApprovalOrAwarded = (s: Sanction) => sanctionIsAda(s) && sanctionIsProspective(s)

export default class AdditionalDaysAwardedService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async getAdjudicationsXX(
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
    const sanctionedAdas: Ada[] = this.getAdas(individualAdjudications, false, startOfSentenceEnvelope)
    const adas: AdasByDateCharged[] = this.getAdasByDateCharged(sanctionedAdas)
    const totalAdas: number = sanctionedAdas.reduce((acc, cur) => acc + cur.days, 0)

    const prospectiveAdas: Ada[] = this.getAdas(individualAdjudications, true, startOfSentenceEnvelope)
    const suspendedAdas: AdasByDateCharged[] = this.getAdasByDateCharged(prospectiveAdas)
    const totalSuspendedAdas: number = sanctionedAdas.reduce((acc, cur) => acc + cur.days, 0)

    return { totalAdas, adas, totalSuspendedAdas, suspendedAdas } as AdasToReview
  }

  public async getAdjudications(
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
    const sanctionedAdas: Ada[] = this.getAdas(individualAdjudications, false, startOfSentenceEnvelope)
    const adas: AdasByDateCharged[] = this.getAdasByDateCharged(sanctionedAdas)
    const totalAdas: number = sanctionedAdas.reduce((acc, cur) => acc + cur.days, 0)

    const prospectiveAdas: Ada[] = this.getAdas(individualAdjudications, true, startOfSentenceEnvelope)
    const suspendedAdas: AdasByDateCharged[] = this.getAdasByDateCharged(prospectiveAdas)
    const totalSuspendedAdas: number = sanctionedAdas.reduce((acc, cur) => acc + cur.days, 0)

    return { totalAdas, adas, totalSuspendedAdas, suspendedAdas } as AdasToReview
  }

  private getAdasByDateCharged(sanctionedAdas: Ada[]) {
    return sanctionedAdas.reduce((acc: AdasByDateCharged[], cur) => {
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
  ): Ada[] {
    const adasToTransform = individualAdjudications.filter(ad =>
      ad.hearings.some(
        h =>
          new Date(h.hearingTime.substring(0, 10)).getTime() >= startOfSentenceEnvelope.getTime() &&
          h.results.some(r => r.sanctions.some(s => isProspectiveAda(s) ||  isSanctionedAda(s))),
      ),
    )
    return adasToTransform.reduce((acc: Ada[], cur) => {
      cur.hearings
        .filter(
          h =>
            new Date(h.hearingTime.substring(0, 10)).getTime() >= startOfSentenceEnvelope.getTime() &&
            h.results.some(r => r.sanctions.some(s => (prospectiveAdas ? isProspectiveAda(s) : isSanctionedAda(s)))),
        )
        .forEach(hearing => {
          const result = hearing.results.find(r =>
            r.sanctions.some(s => (prospectiveAdas ? isProspectiveAda(s) : isSanctionedAda(s))),
          )
          result.sanctions
            .filter(s => (prospectiveAdas ? isProspectiveAda(s) : isSanctionedAda(s)))
            .forEach(sanction => {
              const ada = {
                dateChargeProved: new Date(hearing.hearingTime.substring(0, 10)),
                chargeNumber: cur.adjudicationNumber,
                toBeServed: 'TODO',
                heardAt: hearing.establishment,
                status: sanction.status,
                days: sanction.sanctionDays,
              } as Ada
              acc.push(ada)
            })
        })
      return acc
    }, [])
  }
private getAdasX(
    individualAdjudications: Awaited<IndividualAdjudication>[],
    prospectiveAdas: boolean,
    startOfSentenceEnvelope: Date,
  ): Ada[] {
    const adasToTransform = individualAdjudications.filter(ad =>
      ad.hearings.some(
        h =>
          new Date(h.hearingTime.substring(0, 10)).getTime() >= startOfSentenceEnvelope.getTime() &&
          h.results.some(r => r.sanctions.some(s => (prospectiveAdas ? isProspectiveAda(s) : isSanctionedAda(s)))),
      ),
    )
    return adasToTransform.reduce((acc: Ada[], cur) => {
      cur.hearings
        .filter(
          h =>
            new Date(h.hearingTime.substring(0, 10)).getTime() >= startOfSentenceEnvelope.getTime() &&
            h.results.some(r => r.sanctions.some(s => (prospectiveAdas ? isProspectiveAda(s) : isSanctionedAda(s)))),
        )
        .forEach(hearing => {
          const result = hearing.results.find(r =>
            r.sanctions.some(s => (prospectiveAdas ? isProspectiveAda(s) : isSanctionedAda(s))),
          )
          result.sanctions
            .filter(s => (prospectiveAdas ? isProspectiveAda(s) : isSanctionedAda(s)))
            .forEach(sanction => {
              const ada = {
                dateChargeProved: new Date(hearing.hearingTime.substring(0, 10)),
                chargeNumber: cur.adjudicationNumber,
                toBeServed: 'TODO',
                heardAt: hearing.establishment,
                status: sanction.status,
                days: sanction.sanctionDays,
              } as Ada
              acc.push(ada)
            })
        })
      return acc
    }, [])
  }

  private getAwardedAndAwaitingApprovalAdas(
    individualAdjudications: Awaited<IndividualAdjudication>[],
    suspendedAdas: boolean,
    startOfSentenceEnvelope: Date,
    existingAdas: Adjustment[],
  ): Ada[] {
    const adasToTransform = individualAdjudications.filter(ad =>
      ad.hearings.some(
        h =>
          new Date(h.hearingTime.substring(0, 10)).getTime() >= startOfSentenceEnvelope.getTime() &&
          h.results.some(r =>
            r.sanctions.some(s => (suspendedAdas ? isSanctionSuspended(s) : !isSanctionSuspended(s))),
          ),
      ),
    )
    return adasToTransform.reduce((acc: Ada[], cur) => {
      cur.hearings
        .filter(
          h =>
            new Date(h.hearingTime.substring(0, 10)).getTime() >= startOfSentenceEnvelope.getTime() &&
            h.results.some(r =>
              r.sanctions.some(s => (suspendedAdas ? isSanctionSuspended(s) : !isSanctionSuspended(s))),
            ),
        )
        .forEach(hearing => {
          const result = hearing.results.find(r =>
            r.sanctions.some(s => (suspendedAdas ? isSanctionSuspended(s) : !isSanctionSuspended(s))),
          )
          result.sanctions
            .filter(s => (suspendedAdas ? isSanctionSuspended(s) : !isSanctionSuspended(s)))
            .forEach(sanction => {
              const ada = {
                dateChargeProved: new Date(hearing.hearingTime.substring(0, 10)),
                chargeNumber: cur.adjudicationNumber,
                toBeServed: 'TODO',
                heardAt: hearing.establishment,
                status: existingAdas.some(
                  existingAda =>
                    (existingAda.additionalDaysAwarded.adjudicationId as unknown as number) === cur.adjudicationNumber,
                )
                  ? 'Awarded'
                  : 'Awaiting Approval',
                days: sanction.sanctionDays,
              } as Ada
              acc.push(ada)
            })
        })
      return acc
    }, [])
  }
}

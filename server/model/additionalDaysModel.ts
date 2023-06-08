import dayjs from 'dayjs'
import { PrisonApiAdjudication, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import AdjudicationModel from './adjudicationModel'

export default class AdditionalDaysModel {
  public adjudications: AdjudicationModel[]

  constructor(public prisonerDetail: PrisonApiPrisoner, adjudications: PrisonApiAdjudication[]) {
    this.adjudications = adjudications
      .flatMap(adj => {
        return adj.hearings.flatMap(hearing => {
          return hearing.results.map(result => {
            const sanction = result.sanctions.find(
              thisSanction =>
                thisSanction.sanctionType === 'Additional Days Added' &&
                !!thisSanction.sanctionDays &&
                thisSanction.status === 'Immediate',
            )
            if (sanction) {
              return new AdjudicationModel(
                adj.adjudicationNumber,
                adj.reportNumber,
                sanction.sanctionDays,
                hearing.hearingTime,
                sanction.sanctionSeq,
                sanction.consecutiveSanctionSeq,
              )
            }
            return null
          })
        })
      })
      .filter(adj => !!adj)
  }

  toItems() {
    return this.adjudications.map(adj => {
      const consec = adj.consecutiveSanctionSeq
        ? this.adjudications.find(adj2 => adj.consecutiveSanctionSeq === adj2.sanctionSeq)
        : null
      return {
        value: adj.adjudicationNumber,
        text: `Report number: ${adj.reportNumber}, ${adj.days} days awarded.`,
        hint: {
          text: `Date charge proved: ${dayjs(adj.hearingDate).format('DD MMMM YYYY')} ${
            consec ? `Consecutive to report ID: ${consec.reportNumber} Adj no: ${consec.adjudicationNumber}` : ''
          }`,
        },
      }
    })
  }
}

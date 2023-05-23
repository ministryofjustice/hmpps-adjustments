import { Remand, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class RelevantRemandModel {
  constructor(public prisonerDetail: PrisonApiPrisoner, public relevantRemand: RemandResult) {}

  public isNotRelevant(sentenceRemand: Remand): boolean {
    return !this.relevantRemand.sentenceRemand.find(it => it.charge.chargeId === sentenceRemand.charge.chargeId)
  }
}

import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class RemandChangeModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public listOffences() {
    return this.sentencesAndOffences.flatMap(so => {
      return so.offences.filter(off => this.adjustment.remand?.chargeId.includes(off.offenderChargeId))
    })
  }
}

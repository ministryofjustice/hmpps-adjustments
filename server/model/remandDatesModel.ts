import SessionAdjustment from '../@types/AdjustmentTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import RemandDatesForm from './remandDatesForm'

export default class RemandDatesModel {
  constructor(
    public id: string,
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: SessionAdjustment[],
    public form: RemandDatesForm,
  ) {}

  public backlink(): string {
    if (this.adjustments.length > 1 || this.adjustments[0].complete) {
      return `/${this.prisonerDetail.offenderNo}/remand/review`
    }
    return `/${this.prisonerDetail.offenderNo}`
  }
}

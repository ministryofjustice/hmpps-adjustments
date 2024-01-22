import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import TaggedBailDaysForm from './taggedBailDaysForm'
import SessionAdjustment from '../@types/AdjustmentTypes'

export default class TaggedBailDaysModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    private addOrEdit: string,
    private id: string,
    public form: TaggedBailDaysForm,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    if (this.adjustment.complete) {
      return `/${this.prisonerDetail.offenderNo}/tagged-bail/review/${this.addOrEdit}/${this.id}`
    }
    return `/${this.prisonerDetail.offenderNo}/tagged-bail/select-case/${this.addOrEdit}/${this.id}`
  }
}

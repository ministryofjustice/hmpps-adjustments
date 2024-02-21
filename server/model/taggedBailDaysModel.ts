import TaggedBailDaysForm from './taggedBailDaysForm'
import SessionAdjustment from '../@types/AdjustmentTypes'

export default class TaggedBailDaysModel {
  constructor(
    public prisonerNumber: string,
    private addOrEdit: string,
    private id: string,
    public form: TaggedBailDaysForm,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    if (this.adjustment.complete) {
      return `/${this.prisonerNumber}/tagged-bail/review/${this.addOrEdit}/${this.id}`
    }
    return `/${this.prisonerNumber}/tagged-bail/select-case/${this.addOrEdit}/${this.id}`
  }
}

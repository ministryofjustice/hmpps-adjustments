import SessionAdjustment from '../@types/AdjustmentTypes'
import RemandDatesForm from './remandDatesForm'

export default class RemandDatesModel {
  constructor(
    public id: string,
    public adjustments: SessionAdjustment[],
    public form: RemandDatesForm,
    public prisonerNumber: string,
    public addOrEdit: string = null,
  ) {}

  public backlink(): string {
    if (this.addOrEdit === 'edit') return `/${this.prisonerNumber}/remand/edit/${this.id}`
    if (this.adjustments.length > 1 || this.adjustments[0].complete) {
      return `/${this.prisonerNumber}/remand/review`
    }
    return `/${this.prisonerNumber}`
  }
}

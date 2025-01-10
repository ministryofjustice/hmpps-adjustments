import SessionAdjustment from '../../@types/AdjustmentTypes'
import SpecialRemissionDaysForm from './specialRemissionDaysForm'

export default class SpecialRemissionDaysModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public form: SpecialRemissionDaysForm,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/special-remission/check/${this.addOrEdit}/${this.id}`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/special-remission/view`
  }
}

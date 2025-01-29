import SessionAdjustment from '../../@types/AdjustmentTypes'
import TimeSpentInCustodyAbroadDaysForm from './timeSpentInCustodyAbroadDaysForm'

export default class TimeSpentInCustodyAbroadDaysModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public form: TimeSpentInCustodyAbroadDaysForm,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/custody-abroad/documentation/${this.addOrEdit}/${this.id}`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/custody-abroad/view`
  }
}

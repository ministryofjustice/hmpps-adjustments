import SessionAdjustment from '../../@types/AdjustmentTypes'
import TimeSpentAsAnAppealApplicantDaysForm from './timeSpentAsAnAppealApplicantDaysForm'

export default class TimeSpentAsAnAppealApplicantDaysModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public form: TimeSpentAsAnAppealApplicantDaysForm,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/appeal-applicant/view`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/appeal-applicant/view`
  }
}

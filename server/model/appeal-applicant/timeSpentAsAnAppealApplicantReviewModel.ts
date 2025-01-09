import SessionAdjustment from '../../@types/AdjustmentTypes'

export default class TimeSpentAsAnAppealApplicantReviewModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/appeal-applicant/reference/${this.addOrEdit}/${this.id}`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}/` : `/${this.nomsId}/appeal-applicant/view`
  }
}

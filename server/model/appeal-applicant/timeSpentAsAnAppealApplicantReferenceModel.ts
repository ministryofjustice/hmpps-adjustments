import SessionAdjustment from '../../@types/AdjustmentTypes'
import ValidationError from '../validationError'

export default class TimeSpentAsAnAppealApplicantReferenceModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
    public errors?: ValidationError[],
    public reference?: string,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/appeal-applicant/days/${this.addOrEdit}/${this.id}`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/appeal-applicant/view`
  }

  public errorList(): { html: string; text: string; href: string | null }[] {
    return this.errors.map(it => {
      return {
        text: it.text,
        html: it.html,
        href: it.fields.length ? `#${it.fields[0]}` : null,
      }
    })
  }
}

import SessionAdjustment from '../../@types/AdjustmentTypes'
import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'

export default class TimeSpentInCustodyAbroadReviewModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/custody-abroad/days/${this.addOrEdit}/${this.id}`
  }

  public timeSpentInCustodyAbroadDocumentationSource(): string {
    return timeSpentInCustodyAbroadDocumentationSource.find(
      it => it.value === this.adjustment.timeSpentInCustodyAbroad?.documentationSource,
    ).text
  }

  public cancelLink(): string {
    return `/${this.nomsId}/`
  }
}

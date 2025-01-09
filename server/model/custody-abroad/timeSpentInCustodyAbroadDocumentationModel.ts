import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'
import SessionAdjustment from '../../@types/AdjustmentTypes'

export default class TimeSpentInCustodyAbroadDocumentationModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
    public notSelected?: boolean,
  ) {}

  public backlink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/custody-abroad/view`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/custody-abroad/view`
  }

  public errorMessage(): { text: string; href: string } {
    return this.notSelected
      ? {
          text: 'You must select an option',
          href: '#documentationSource',
        }
      : null
  }

  documentationSources() {
    return timeSpentInCustodyAbroadDocumentationSource.map(it => {
      return { ...it, checked: this.adjustment.timeSpentInCustodyAbroad?.documentationSource === it.value }
    })
  }
}

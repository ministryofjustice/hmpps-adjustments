import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'

export default class TimeSpentInCustodyAbroadRemoveModel {
  constructor(
    public nomsId: string,
    public adjustment: Adjustment,
  ) {}

  public backLink(): string {
    return `/${this.nomsId}/custody-abroad/view`
  }

  public rows() {
    return [
      [
        { text: 'Entered by' },
        {
          text: `${this.adjustment.prisonName}`,
        },
      ],
      [{ text: 'Number of days' }, { text: this.adjustment.days }],
      [
        { text: 'Documentation Source' },
        {
          text: timeSpentInCustodyAbroadDocumentationSource.find(
            it => it.value === this.adjustment.timeSpentInCustodyAbroad?.documentationSource,
          ).text,
        },
      ],
    ]
  }

  public table() {
    return {
      rows: this.rows(),
      attributes: { 'data-qa': 'view-table' },
      firstCellIsHeader: true,
    }
  }
}

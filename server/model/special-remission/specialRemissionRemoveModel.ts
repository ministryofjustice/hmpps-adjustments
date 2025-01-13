import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import specialRemissionType from './specialRemissionType'

export default class SpecialRemissionRemoveModel {
  constructor(
    public nomsId: string,
    public adjustment: Adjustment,
  ) {}

  public backLink(): string {
    return `/${this.nomsId}/special-remission/view`
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
        { text: 'Type' },
        { text: specialRemissionType.find(it => it.value === this.adjustment.specialRemission?.type).text },
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

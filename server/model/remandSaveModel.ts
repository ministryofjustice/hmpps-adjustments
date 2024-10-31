import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { daysBetween } from '../utils/utils'

export default class RemandSaveModel {
  constructor(
    public adjustments: Adjustment[],
    public unusedDeductions: number,
  ) {}

  public table() {
    return {
      head: [{ text: 'Remand period' }, { text: 'Days spent on remand' }],
      rows: [...this.rows(), this.totalRow()],
    }
  }

  private totalRow() {
    return [
      {
        text: 'Total days',
        classes: 'govuk-table__header',
      },
      {
        text: this.adjustments
          .map(it => daysBetween(new Date(it.fromDate), new Date(it.toDate)))
          .reduce((sum, current) => sum + current, 0),
      },
    ]
  }

  private rows() {
    return this.adjustments.map(it => {
      return [
        {
          text: `${dayjs(it.fromDate).format('D MMMM YYYY')} to ${dayjs(it.toDate).format('D MMMM YYYY')}`,
        },
        {
          text: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
        },
      ]
    })
  }
}

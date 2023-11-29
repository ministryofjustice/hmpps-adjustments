import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween } from '../utils/utils'

export default class RemandSaveModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: Adjustment[],
    public unusedDeductions: number,
  ) {}

  public table() {
    return {
      head: [{ text: 'Period of remand' }, { text: 'Days spent on remand' }],
      rows: this.rows(),
    }
  }

  public rows() {
    return this.adjustments.map(it => {
      return [
        {
          text: `${dayjs(it.fromDate).format('DD MMMM YYYY')} to ${dayjs(it.toDate).format('DD MMMM YYYY')}`,
        },
        {
          text: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
        },
      ]
    })
  }
}

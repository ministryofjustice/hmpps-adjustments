import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

export default class ReviewAndSubmitAdaViewModel {
  constructor(
    public adjustments: Adjustment[],
    public existingAdjustments: Adjustment[],
    public quashedAdjustments: Adjustment[],
  ) {}

  public displayBanner(): boolean {
    const anyUnlinkedAdas = this.existingAdjustments.some(it => !it.additionalDaysAwarded?.adjudicationId?.length)
    if (anyUnlinkedAdas) {
      const existingDays = this.existingAdjustments.map(a => a.days).reduce((sum, current) => sum + current, 0)
      const newDays = this.adjustments.map(a => a.days).reduce((sum, current) => sum + current, 0)
      return existingDays !== newDays
    }
    return false
  }

  public createTable() {
    if (this.adjustments.length) {
      return {
        caption: 'ADA details',
        head: [{ text: 'Date charge proved' }, { text: 'Charge number(s)' }, { text: 'Days', format: 'numeric' }],
        rows: [
          ...this.adjustments.map(it => {
            return [
              { text: dayjs(it.fromDate).format('D MMM YYYY') },
              { html: it.additionalDaysAwarded.adjudicationId.join('<br/>') },
              { text: it.days, format: 'numeric' },
            ]
          }),
          [
            { html: '<strong>Total ADAs taken into calculation</strong>', colspan: 2 },
            {
              text: this.adjustments.map(a => a.days).reduce((sum, current) => sum + current, 0),
              format: 'numeric',
            },
          ],
        ],
      }
    }
    return null
  }

  public quashedTable() {
    if (this.quashedAdjustments.length) {
      return {
        caption: 'Quashed ADA details',
        head: [{ text: 'Date charge proved' }, { text: 'Charge number(s)' }, { text: 'Days', format: 'numeric' }],
        rows: [
          ...this.quashedAdjustments.map(it => {
            return [
              { text: dayjs(it.fromDate).format('D MMM YYYY') },
              { html: it.additionalDaysAwarded.adjudicationId.join('<br/>') },
              { text: it.days, format: 'numeric' },
            ]
          }),
          [
            { text: 'Total Quashed ADAs', colspan: 2 },
            {
              text: this.quashedAdjustments.map(a => a.days).reduce((sum, current) => sum + current, 0),
              format: 'numeric',
            },
          ],
        ],
      }
    }
    return null
  }
}

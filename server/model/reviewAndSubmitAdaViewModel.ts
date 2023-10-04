import dayjs from 'dayjs'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

export default class ReviewAndSubmitAdaViewModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: Adjustment[],
  ) {}

  public table() {
    return {
      caption: 'Ada details',
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
          { text: 'Total ADAs', colspan: 2 },
          { text: this.adjustments.map(a => a.days).reduce((sum, current) => sum + current, 0), format: 'numeric' },
        ],
      ],
    }
  }
}

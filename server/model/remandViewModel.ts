import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { offencesForAdjustment } from '../utils/utils'

export default class RemandViewModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: Adjustment[],
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public remandTotals() {
    return [
      ...this.adjustments.map(it => {
        return [
          { text: `From ${dayjs(it.fromDate).format('DD MMM YYYY')} to ${dayjs(it.toDate).format('DD MMM YYYY')}` },
          { text: it.daysBetween || it.effectiveDays },
        ]
      }),
      [{ text: 'Total days', classes: 'govuk-table__header' }, { text: this.totalDays() }],
    ]
  }

  public adjustmentsWithOffences() {
    return this.adjustments.map(it => {
      return {
        ...it,
        daysToDisplay: it.daysBetween || it.effectiveDays,
        offences: offencesForAdjustment(it, this.sentencesAndOffences),
      }
    })
  }

  public totalDays() {
    return this.adjustments.reduce((sum, it) => sum + (it.daysBetween || it.effectiveDays), 0)
  }
}

import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import {
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  getSentenceRecallTagHTML,
  isSentenceRecalled,
  offencesForAdjustment,
} from '../utils/utils'

export default class RemandViewModel {
  constructor(
    public adjustments: Adjustment[],
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public remandTotals() {
    return [
      ...this.adjustments.map(it => {
        return [
          { text: `From ${dayjs(it.fromDate).format('DD MMM YYYY')} to ${dayjs(it.toDate).format('DD MMM YYYY')}` },
          { text: it.days },
        ]
      }),
      [{ text: 'Total days on remand', classes: 'govuk-table__header' }, { text: this.totalDays() }],
    ]
  }

  public adjustmentsWithOffences() {
    return this.adjustments.map(it => {
      const sentenceAndOffence = getMostRecentSentenceAndOffence(this.sentencesAndOffences)
      const recall = isSentenceRecalled(sentenceAndOffence.sentenceCalculationType)

      return {
        ...it,
        daysToDisplay: it.days,
        offences: offencesForAdjustment(it, this.sentencesAndOffences),
        courtName: `${sentenceAndOffence.courtDescription}${recall ? getSentenceRecallTagHTML() : ''}`,
      }
    })
  }

  public totalDays() {
    return this.adjustments.reduce((sum, it) => sum + it.days, 0)
  }
}

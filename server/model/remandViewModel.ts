import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { offencesForRemandAdjustment } from '../utils/utils'
import UnusedDeductionsMessageViewModel from './unusedDeductionsMessageViewModel'
import { UnusedDeductionMessageType } from '../services/unusedDeductionsService'

export default class RemandViewModel {
  public adjustments: Adjustment[]

  public unusedDeductionMessage: UnusedDeductionsMessageViewModel

  constructor(
    prisonerNumber: string,
    allAdjustments: Adjustment[],
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    unusedDeductionsMessageType: UnusedDeductionMessageType,
  ) {
    this.adjustments = allAdjustments.filter(it => it.adjustmentType === 'REMAND')
    this.unusedDeductionMessage = new UnusedDeductionsMessageViewModel(
      prisonerNumber,
      allAdjustments,
      unusedDeductionsMessageType,
    )
  }

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
      return {
        ...it,
        daysToDisplay: it.days,
        offences: offencesForRemandAdjustment(it, this.sentencesAndOffences),
      }
    })
  }

  public totalDays() {
    return this.adjustments.reduce((sum, it) => sum + it.days, 0)
  }
}

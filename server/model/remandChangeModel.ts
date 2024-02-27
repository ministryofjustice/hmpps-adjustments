import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { offencesForAdjustment, remandRelatedValidationSummary } from '../utils/utils'

export default class RemandChangeModel {
  constructor(
    public adjustment: Adjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private calculatedUnusedDeductions: UnusedDeductionCalculationResponse,
    public showUnusedMessage: boolean,
  ) {}

  public listOffences() {
    return offencesForAdjustment(this.adjustment, this.sentencesAndOffences)
  }

  public remandRelatedValidationSummary() {
    return remandRelatedValidationSummary(this.calculatedUnusedDeductions?.validationMessages)
  }
}

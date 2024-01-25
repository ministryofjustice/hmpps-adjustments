import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { offencesForAdjustment, remandRelatedValidationSummary } from '../utils/utils'

export default class RemandChangeModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private currentAdjustments: Adjustment[],
    private calculatedUnusedDeductions: UnusedDeductionCalculationResponse,
  ) {}

  public listOffences() {
    return offencesForAdjustment(this.adjustment, this.sentencesAndOffences)
  }

  public showUnusedMessage() {
    if (this.calculatedUnusedDeductions?.unusedDeductions != null) {
      const currentUnusedDeductions = this.currentAdjustments
        .filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
        .map(it => it.effectiveDays)
        .reduce((sum, current) => sum + current, 0)

      const toBeUnusedDeductions = this.calculatedUnusedDeductions.unusedDeductions

      return toBeUnusedDeductions !== currentUnusedDeductions
    }
    return false
  }

  public remandRelatedValidationSummary() {
    return remandRelatedValidationSummary(this.calculatedUnusedDeductions?.validationMessages)
  }
}

import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { offencesForAdjustment, remandRelatedValidationSummary } from '../utils/utils'

export default class RemandChangeModel {
  constructor(
    public adjustment: Adjustment,
    private dbAdjustment: Adjustment,
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

  public isModified(): boolean {
    let modified = false
    if (this.dbAdjustment) {
      if (this.adjustment.remand.chargeId.length !== this.dbAdjustment.remand.chargeId.length) {
        modified = true
      } else {
        const sessionAdjustmentCharges = this.adjustment.remand.chargeId.sort((a, b) => a - b)
        const dbAdjustmentCharges = this.dbAdjustment.remand.chargeId.sort((a, b) => a - b)

        for (let i = 0; i < sessionAdjustmentCharges.length; i += 1) {
          if (sessionAdjustmentCharges[i] !== dbAdjustmentCharges[i]) {
            modified = true
          }
        }
      }

      if (
        !modified &&
        (this.adjustment.toDate !== this.dbAdjustment.toDate || this.adjustment.fromDate !== this.dbAdjustment.fromDate)
      ) {
        modified = true
      }
    }

    return modified
  }
}

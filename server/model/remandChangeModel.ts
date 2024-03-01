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
    if (!this.dbAdjustment) {
      return false
    }

    const sessionCharges = this.adjustment.remand.chargeId.sort((a, b) => a - b)
    const dbCharges = this.dbAdjustment.remand.chargeId.sort((a, b) => a - b)

    const chargeIdModified = !sessionCharges.every((chargeId, index) => chargeId === dbCharges[index])

    const dateModified =
      this.adjustment.toDate !== this.dbAdjustment.toDate || this.adjustment.fromDate !== this.dbAdjustment.fromDate

    return chargeIdModified || dateModified
  }
}

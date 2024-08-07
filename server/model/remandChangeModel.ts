import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { offencesForRemandAdjustment, remandRelatedValidationSummary } from '../utils/utils'

export default class RemandChangeModel {
  constructor(
    public adjustment: Adjustment,
    private dbAdjustment: Adjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private calculatedUnusedDeductions: UnusedDeductionCalculationResponse,
    public showUnusedMessage: boolean,
    public reviewDeductions: boolean = false,
  ) {}

  public listOffences() {
    return offencesForRemandAdjustment(this.adjustment, this.sentencesAndOffences)
  }

  public remandRelatedValidationSummary() {
    return remandRelatedValidationSummary(this.calculatedUnusedDeductions?.validationMessages)
  }

  public isModified(): boolean {
    if (!this.dbAdjustment) {
      return false
    }

    if (this.reviewDeductions) {
      return true
    }

    const sessionCharges = this.adjustment?.remand?.chargeId || []
    const dbCharges = this.dbAdjustment?.remand?.chargeId || []

    const chargesSame = sessionCharges.length === dbCharges.length && sessionCharges.every(it => dbCharges.includes(it))

    const datesSame =
      this.adjustment.toDate === this.dbAdjustment.toDate && this.adjustment.fromDate === this.dbAdjustment.fromDate

    const adjustmentSame = chargesSame && datesSame
    return !adjustmentSame
  }
}

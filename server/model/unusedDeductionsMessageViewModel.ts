import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import config from '../config'
import { UnusedDeductionMessageType } from '../services/unusedDeductionsService'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export default class UnusedDeductionsMessageViewModel {
  public checkInformationLink: string

  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
    public unusedDeductionMessage: UnusedDeductionMessageType,
  ) {
    this.checkInformationLink = `${config.services.calculateReleaseDatesUI.url}/calculation/${this.prisonerNumber}/check-information?hasErrors=true`
  }

  public deductions(): AdjustmentType[] {
    return adjustmentTypes.filter(it => it.deduction && it.value !== 'UNUSED_DEDUCTIONS')
  }

  public getUnusedDeductionMessage(): string {
    switch (this.unusedDeductionMessage) {
      case 'UNSUPPORTED':
        return this.getUnusedDeductionMessageForUnsupported()
      case 'RECALL':
        return this.getUnusedDeductionMessageForRecall()
      case 'VALIDATION':
        return this.getUnusedDeductionMessageForValidation()
      case 'NOMIS_ADJUSTMENT':
        return this.getUnusedDeductionMessageForNomisAdjustment()
      case 'UNKNOWN':
        return this.getUnusedDeductionMessageForUnknown()
      case 'NONE':
        break
      default:
        break
    }

    return ''
  }

  private getUnusedDeductionMessageForUnsupported(): string {
    return this.hasNonNomisUnusedDeductions()
      ? `Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a data-qa="manual-unused-deductions" href="/${this.prisonerNumber}/manual-unused-deductions/days/edit">edit or delete the unused deductions here.</a>`
      : `Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a data-qa="manual-unused-deductions" href="/${this.prisonerNumber}/manual-unused-deductions/days/add">add any unused deductions here.</a>`
  }

  private getUnusedDeductionMessageForRecall(): string {
    return 'Unused deductions cannot be calculated for recall sentences. To view or add unused deductions, go to the sentence adjustments screen in NOMIS.'
  }

  private getUnusedDeductionMessageForValidation(): string {
    return `Some of the data in NOMIS related to this person is incorrect. This means unused deductions cannot be automatically calculated.
            <br />
            To continue, you must:
            <ol>
              <li>
                <a href="${this.checkInformationLink}" target="_blank">Review the incorrect details</a>
              </li>
              <li>
                Update these details
              </li>
              <li>
                <a href="">Reload this page</a>
              </li>
            </ol>`
  }

  private getUnusedDeductionMessageForNomisAdjustment(): string {
    if (config.featureToggles.reviewUnusedDeductions) {
      const hasTaggedBail = this.adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL').length > 0
      const hasRemand = this.adjustments.filter(it => it.adjustmentType === 'REMAND').length > 0
      const hasNOMISUnusedRemand =
        this.adjustments.filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS' && it.source === 'NOMIS').length > 0
      let reviewMessage: string
      if (hasRemand && hasTaggedBail) {
        reviewMessage = 'review remand and tagged bail to calculate'
      } else if (hasRemand) {
        reviewMessage = 'review remand to calculate'
      } else if (hasTaggedBail) {
        reviewMessage = 'review tagged bail to calculate'
      }

      return `Unused deductions have not been calculated${hasNOMISUnusedRemand ? ' as there are unused deductions in NOMIS' : ''} - <a href="/${this.prisonerNumber}/review-deductions">${reviewMessage}</a>`
    }

    return this.hasUnusedDeductions()
      ? 'Unused remand/tagged bail time cannot be calculated. There is unused remand in NOMIS. Go to the sentence adjustments screen on NOMIS to view it.'
      : 'Unused remand/tagged bail time cannot be calculated. Go to the sentence adjustments screen on NOMIS to view or add any unused deductions.'
  }

  private getUnusedDeductionMessageForUnknown(): string {
    return 'Unused remand/tagged bail time cannot be calculated. There may be some present. Any unused deductions must be entered or viewed in NOMIS.'
  }

  public reviewUnusedDeductions(): boolean {
    return config.featureToggles.reviewUnusedDeductions
  }

  public hasNonNomisUnusedDeductions(): boolean {
    return (
      this.adjustments.filter(it => it.source !== 'NOMIS').find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
        ?.effectiveDays > 0 || false
    )
  }

  public hasUnusedDeductions(): boolean {
    return this.adjustments.find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')?.days > 0 || false
  }
}

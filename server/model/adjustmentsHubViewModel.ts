import { AdaAdjudicationDetails, Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { IdentifyRemandDecision, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import config from '../config'
import { UnusedDeductionMessageType } from '../services/unusedDeductionsService'
import { calculateReleaseDatesCheckInformationUrl } from '../utils/utils'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export type Message = {
  type: string
  days: number
  text: string
  action: MessageAction
}

export type MessageAction = 'CREATE' | 'REMOVE' | 'UPDATE' | 'REJECTED' | 'VALIDATION'

export default class AdjustmentsHubViewModel {
  public checkInformationLink: string

  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
    public relevantRemand: RemandResult,
    public remandDecision: IdentifyRemandDecision,
    public roles: string[],
    public message: Message,
    public unusedDeductionMessage: UnusedDeductionMessageType,
    private adaAdjudicationDetails: AdaAdjudicationDetails,
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
    if (config.featureToggles.manualUnusedDeductions) {
      return this.hasNonNomisUnusedDeductions()
        ? `Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a href="/${this.prisonerNumber}/unused-deductions/days/edit">edit or delete the unused deductions here.</a>`
        : `Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a href="/${this.prisonerNumber}/unused-deductions/days/add">add any unused deductions here.</a>`
    }

    return 'Some of the details recorded in NOMIS cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. To add any unused remand, go to the sentence adjustments screen in NOMIS.'
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
      const nomisAdjustments = this.adjustments.filter(it => it.source === 'NOMIS')
      const hasTaggedBail = nomisAdjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL').length > 0
      const hasRemand = nomisAdjustments.filter(it => it.adjustmentType === 'REMAND').length > 0
      const hasUnusedRemand = nomisAdjustments.filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS').length > 0
      let reviewMessage: string
      if (hasRemand && hasTaggedBail) {
        reviewMessage = 'review remand and tagged bail to calculate'
      } else if (hasRemand) {
        reviewMessage = 'review remand to calculate'
      } else if (hasTaggedBail) {
        reviewMessage = 'review tagged bail to calculate'
      }

      return `Unused deductions have not been calculated${hasUnusedRemand ? ' as there are deductions in NOMIS' : ''} - <a href="/${this.prisonerNumber}/review-unused-deductions">${reviewMessage}</a>`
    }

    return this.hasUnusedDeductions()
      ? 'Unused remand/tagged bail time cannot be calculated. There is unused remand in NOMIS. Go to the sentence adjustments screen on NOMIS to view it.'
      : 'Unused remand/tagged bail time cannot be calculated. Go to the sentence adjustments screen on NOMIS to view or add any unused deductions.'
  }

  private getUnusedDeductionMessageForUnknown(): string {
    return 'Unused remand/tagged bail time cannot be calculated. There may be some present. Any unused deductions must be entered or viewed in NOMIS.'
  }

  public manualUnusedDeductions(): boolean {
    return config.featureToggles.manualUnusedDeductions
  }

  public reviewUnusedDeductions(): boolean {
    return config.featureToggles.reviewUnusedDeductions
  }

  public additions(): AdjustmentType[] {
    return adjustmentTypes.filter(it => !it.deduction)
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

  public hasRemandToolRole(): boolean {
    return this.roles.indexOf('REMAND_IDENTIFIER') !== -1
  }

  public showProspectiveAdaLink(adjustmentType: AdjustmentType): boolean {
    return adjustmentType.value === 'ADDITIONAL_DAYS_AWARDED' && !!this.adaAdjudicationDetails?.prospective?.length
  }

  public displayReview(): boolean {
    return (
      this.hasRemandToolRole() &&
      this.relevantRemand &&
      (!this.remandDecision || this.remandDecision.days !== this.getTotalDaysRelevantRemand())
    )
  }

  public displayAddLink(adjustmentType: AdjustmentType): boolean {
    return (
      !this.hasRemandToolRole() ||
      adjustmentType.value !== 'REMAND' ||
      (this.remandDecision && !this.remandDecision.accepted)
    )
  }

  public getTotalDays(adjustmentType: AdjustmentType) {
    return this.adjustments
      .filter(it => it.adjustmentType === adjustmentType.value)
      .map(a => a.days)
      .reduce((sum, current) => sum + current, 0)
  }

  public getLastUpdated(adjustmentType: AdjustmentType) {
    return this.adjustments
      .filter(it => it.adjustmentType === adjustmentType.value)
      .map(a => {
        return { ...a, lastUpdatedDate: new Date(a.lastUpdatedDate) }
      })
      .reduce((a, b) => (a.lastUpdatedDate > b.lastUpdatedDate ? a : b))
  }

  public showDetails(adjustmentType: AdjustmentType) {
    return this.getTotalDays(adjustmentType) !== 0
  }

  public isAddEditDelete(): boolean {
    return ['CREATE', 'REMOVE', 'UPDATE'].includes(this.message.action)
  }

  public getNotificationBannerHeadingForAddEditDelete(): string {
    if (!this.message || !this.message.action || !this.message.type) {
      return null
    }

    const adjustmentType = adjustmentTypes.find(it => it.value === this.message.type)

    const useShortText =
      adjustmentType.value === 'UNLAWFULLY_AT_LARGE' ||
      adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED' ||
      adjustmentType.value === 'ADDITIONAL_DAYS_AWARDED'

    let heading
    if (this.message.action === 'CREATE') {
      heading = `${this.message.days} ${this.message.days > 1 ? 'days' : 'day'} of ${adjustmentType.shortText} ${this.message.days > 1 ? 'have' : 'has'} been saved`
    } else if (this.message.action === 'REMOVE') {
      heading = `${this.message.days} ${this.message.days > 1 ? 'days' : 'day'} of ${adjustmentType.shortText} ${this.message.days > 1 ? 'have' : 'has'} been deleted`
    } else {
      heading = `${useShortText ? adjustmentType.shortText : adjustmentType.text} details have been updated`
    }

    return heading
  }

  public getTotalDaysRelevantRemand() {
    return this.relevantRemand.sentenceRemand.map(a => a.days).reduce((sum, current) => sum + current, 0)
  }

  public calculateReleaseDatesUrl() {
    return calculateReleaseDatesCheckInformationUrl(this.prisonerNumber)
  }

  public getUnused(adjustmentType: AdjustmentType): number {
    const unusedDeductionAdjustment = this.adjustments
      .filter(it => it.source !== 'NOMIS')
      .find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
    if (
      this.unusedDeductionMessage === 'NONE' ||
      (this.unusedDeductionMessage === 'UNSUPPORTED' && unusedDeductionAdjustment)
    ) {
      const adjustments = this.adjustments.filter(it => it.adjustmentType === adjustmentType.value)
      const total = adjustments.map(a => a.days).reduce((sum, current) => sum + current, 0)
      const effective = adjustments.map(a => a.effectiveDays).reduce((sum, current) => sum + current, 0)
      return total - effective
    }

    return 0
  }

  public showMissingRecallOutcomeMessage(): boolean {
    return this.adaAdjudicationDetails.recallWithMissingOutcome
  }
}

import { AdaAdjudicationDetails, Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { IdentifyRemandDecision } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { UnusedDeductionMessageType } from '../services/unusedDeductionsService'
import { calculateReleaseDatesCheckInformationUrl } from '../utils/utils'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'
import UnusedDeductionsMessageViewModel from './unused-deductions/unusedDeductionsMessageViewModel'

export type Message = {
  type: string
  days: number
  text: string
  action: MessageAction
}

export type MessageAction = 'CREATE' | 'REMOVE' | 'UPDATE' | 'REJECTED' | 'VALIDATION'

export default class AdjustmentsHubViewModel {
  public unusedDeductionMessage: UnusedDeductionsMessageViewModel

  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
    public remandDecision: IdentifyRemandDecision,
    public roles: string[],
    public message: Message,
    unusedDeductionsMessageType: UnusedDeductionMessageType,
    private adaAdjudicationDetails: AdaAdjudicationDetails,
    inactiveDeletedAdjustments: Adjustment[],
    private remandBannerVisible: boolean,
  ) {
    this.unusedDeductionMessage = new UnusedDeductionsMessageViewModel(
      prisonerNumber,
      adjustments,
      unusedDeductionsMessageType,
      inactiveDeletedAdjustments,
      remandBannerVisible,
    )
  }

  public deductions(): AdjustmentType[] {
    return adjustmentTypes.filter(it => it.deduction && it.value !== 'UNUSED_DEDUCTIONS')
  }

  public additions(): AdjustmentType[] {
    return adjustmentTypes.filter(it => !it.deduction)
  }

  public showProspectiveAdaLink(adjustmentType: AdjustmentType): boolean {
    return adjustmentType.value === 'ADDITIONAL_DAYS_AWARDED' && !!this.adaAdjudicationDetails?.prospective?.length
  }

  public displayAddLink(adjustmentType: AdjustmentType): boolean {
    return !this.hasRemandToolRole() || !this.isRemand(adjustmentType) || this.isRemandDecisionRejected()
  }

  private isRemandDecisionRejected(): boolean {
    return this.remandDecision?.accepted === false
  }

  private isRemandDecisionAccepted(): boolean {
    return this.remandDecision?.accepted === true
  }

  private isRemandDecisionUnanswered(): boolean {
    return !this.remandDecision
  }

  public hasRemandToolRole(): boolean {
    return this.roles.indexOf('REMAND_IDENTIFIER') !== -1
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

  public isRemand(adjustmentType: AdjustmentType) {
    return adjustmentType.value === 'REMAND'
  }

  public displayReviewRemand(adjustmentType: AdjustmentType): boolean {
    return (
      this.hasRemandToolRole() &&
      this.isRemand(adjustmentType) &&
      (this.remandBannerVisible ||
        this.isRemandDecisionUnanswered() ||
        this.isRemandDecisionAccepted() ||
        this.displayReviewRemandForZeroDayRejection(adjustmentType))
    )
  }

  private displayReviewRemandForZeroDayRejection(adjustmentType: AdjustmentType): boolean {
    return this.isRemandDecisionRejected() && this.getTotalDays(adjustmentType) === 0
  }

  public getLalAffectsDateText(adjustmentType: AdjustmentType): string {
    const lalAdjustments = this.adjustments.filter(it => it.adjustmentType === 'LAWFULLY_AT_LARGE')
    if (
      adjustmentType?.value !== 'LAWFULLY_AT_LARGE' ||
      lalAdjustments.length !== 1 ||
      lalAdjustments[0].lawfullyAtLarge == null
    ) {
      return null
    }
    return lalAdjustments[0].lawfullyAtLarge.affectsDates === 'YES'
      ? 'These days will affect the release dates'
      : 'These additional days will not adjust the release dates'
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
      adjustmentType.value === 'ADDITIONAL_DAYS_AWARDED' ||
      adjustmentType.value === 'CUSTODY_ABROAD' ||
      adjustmentType.value === 'APPEAL_APPLICANT'

    let heading
    if (this.message.action === 'CREATE') {
      heading = `${this.message.days} ${this.message.days > 1 ? 'days' : 'day'} of ${adjustmentType.shortText} ${this.message.days > 1 ? 'have' : 'has'} been saved`
    } else if (this.message.action === 'REMOVE') {
      heading = `${this.message.days} ${this.message.days > 1 ? 'days' : 'day'} of ${adjustmentType.shortText} ${this.message.days > 1 ? 'have' : 'has'} been deleted`
    } else {
      heading = `${useShortText ? adjustmentType.shortText : adjustmentType.text} details have been updated`
      heading = `${heading.charAt(0).toUpperCase()}${heading.slice(1)}`
    }

    return heading
  }

  public calculateReleaseDatesUrl() {
    return calculateReleaseDatesCheckInformationUrl(this.prisonerNumber)
  }

  public getUnused(adjustmentType: AdjustmentType): number {
    if (this.unusedDeductionMessage.unusedDeductionMessage === 'NONE' || this.unusedDeductionsManuallyEnteredInDps()) {
      const adjustments = this.adjustments.filter(it => it.adjustmentType === adjustmentType.value)
      const total = adjustments.map(a => a.days).reduce((sum, current) => sum + current, 0)
      const effective = adjustments.map(a => a.effectiveDays).reduce((sum, current) => sum + current, 0)
      return total - effective
    }

    return 0
  }

  private unusedDeductionsManuallyEnteredInDps() {
    const unusedDeductionAdjustment = this.adjustments
      .filter(it => it.source !== 'NOMIS')
      .find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
    return (
      ['UNSUPPORTED', 'RECALL'].includes(this.unusedDeductionMessage.unusedDeductionMessage) &&
      unusedDeductionAdjustment
    )
  }

  public showMissingRecallOutcomeMessage(): boolean {
    return this.adaAdjudicationDetails.recallWithMissingOutcome
  }
}

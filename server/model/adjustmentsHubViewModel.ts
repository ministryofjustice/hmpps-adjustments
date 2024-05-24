import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
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
  ) {
    this.checkInformationLink = `${config.services.calculateReleaseDatesUI.url}/calculation/${this.prisonerNumber}/check-information?hasErrors=true`
  }

  public deductions(): AdjustmentType[] {
    return adjustmentTypes.filter(it => it.deduction)
  }

  public additions(): AdjustmentType[] {
    return adjustmentTypes.filter(it => !it.deduction)
  }

  public hasRemandToolRole(): boolean {
    return this.roles.indexOf('REMAND_IDENTIFIER') !== -1
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

  private allDeductionsOnDps() {
    const anyDeductionFromNomis = this.allDeductions().some(
      it => !it.remand?.chargeId?.length && !it.taggedBail?.caseSequence,
    )
    return !anyDeductionFromNomis
  }

  private allDeductions() {
    return this.adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
  }

  public getUnused(adjustmentType: AdjustmentType): number {
    if (this.allDeductionsOnDps()) {
      const adjustments = this.adjustments.filter(it => it.adjustmentType === adjustmentType.value)
      const total = adjustments.map(a => a.days).reduce((sum, current) => sum + current, 0)
      const effective = adjustments.map(a => a.effectiveDays).reduce((sum, current) => sum + current, 0)
      return total - effective
    }
    return 0
  }
}

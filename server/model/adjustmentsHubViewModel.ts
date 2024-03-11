import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { IdentifyRemandDecision, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { calculateReleaseDatesCheckInformationUrl } from '../utils/utils'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export type Message = {
  type: string
  days: number
  text: string
  action: MessageAction
}

export type MessageAction =
  | 'CREATE'
  | 'REMOVE'
  | 'UPDATE'
  | 'REJECTED'
  | 'VALIDATION'
  | 'ADDITIONAL_DAYS_UPDATE'
  | 'REMAND_CREATE'
  | 'REMAND_UPDATE'
  | 'REMAND_REMOVE'
  | 'TAGGED_BAIL_CREATE'
  | 'TAGGED_BAIL_UPDATE'
  | 'TAGGED_BAIL_REMOVE'
  | 'UNLAWFULLY_AT_LARGE_CREATE'
  | 'UNLAWFULLY_AT_LARGE_UPDATE'
  | 'UNLAWFULLY_AT_LARGE_REMOVE'

export default class AdjustmentsHubViewModel {
  public adjustmentTypes = adjustmentTypes

  public messageType: AdjustmentType

  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
    public relevantRemand: RemandResult,
    public remandDecision: IdentifyRemandDecision,
    public roles: string[],
    public message: Message,
    public serviceHasCalculatedUnusedDeductions: boolean,
  ) {
    this.messageType = message && this.adjustmentTypes.find(it => it.value === message.type)
  }

  public static getMessageAction(
    adjustmentType:
      | 'REMAND'
      | 'TAGGED_BAIL'
      | 'UNLAWFULLY_AT_LARGE'
      | 'LAWFULLY_AT_LARGE'
      | 'ADDITIONAL_DAYS_AWARDED'
      | 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED'
      | 'SPECIAL_REMISSION'
      | 'UNUSED_DEDUCTIONS',
    action: 'CREATE' | 'UPDATE' | 'REMOVE',
  ): MessageAction {
    if (adjustmentType === 'REMAND' || adjustmentType === 'TAGGED_BAIL' || adjustmentType === 'UNLAWFULLY_AT_LARGE') {
      return `${adjustmentType}_${action}`
    }

    return action
  }

  public deductions(): AdjustmentType[] {
    return this.adjustmentTypes.filter(it =>
      ['REMAND', 'TAGGED_BAIL', 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED'].includes(it.value),
    )
  }

  public additions(): AdjustmentType[] {
    return this.adjustmentTypes.filter(it => ['UNLAWFULLY_AT_LARGE', 'ADDITIONAL_DAYS_AWARDED'].includes(it.value))
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

  public showDaysChanged(): boolean {
    return (
      [
        'REMAND_CREATE',
        'REMAND_UPDATE',
        'REMAND_REMOVE',
        'TAGGED_BAIL_CREATE',
        'TAGGED_BAIL_UPDATE',
        'TAGGED_BAIL_REMOVE',
        'UNLAWFULLY_AT_LARGE_CREATE',
        'UNLAWFULLY_AT_LARGE_UPDATE',
        'UNLAWFULLY_AT_LARGE_REMOVE',
      ] as MessageAction[]
    ).includes(this.message.action)
  }

  public getNotificationBannerHeading(): string {
    if (!this.message || !this.message.action) {
      return null
    }

    let type = ''
    if (this.message.action.indexOf('REMAND') > -1) {
      type = 'Remand'
    } else if (this.message.action.indexOf('TAGGED_BAIL') > -1) {
      type = 'Tagged bail'
    } else if (this.message.action.indexOf('UNLAWFULLY_AT_LARGE') > -1) {
      type = 'UAL'
    }

    let heading
    if (this.message.action.indexOf('CREATE') > -1) {
      heading = `${this.message.days} ${this.message.days > 1 ? 'days' : 'day'} of ${type === 'UAL' ? type : type.toLowerCase()} ${this.message.days > 1 ? 'have' : 'has'} been saved`
    } else if (this.message.action.indexOf('REMOVE') > -1) {
      heading = `${this.message.days} ${this.message.days > 1 ? 'days' : 'day'} of ${type === 'UAL' ? type : type.toLowerCase()} ${this.message.days > 1 ? 'have' : 'has'} been deleted`
    } else {
      heading = `${type} details have been updated`
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

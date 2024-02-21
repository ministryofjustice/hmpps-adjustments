import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { IdentifyRemandDecision, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { calculateReleaseDatesCheckInformationUrl } from '../utils/utils'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export type Message = {
  type: string
  days: number
  text: string
  action:
    | 'CREATE'
    | 'REMOVE'
    | 'UPDATE'
    | 'REJECTED'
    | 'VALIDATION'
    | 'ADDITIONAL_DAYS_UPDATED'
    | 'REMAND_UPDATED'
    | 'REMAND_REMOVED'
    | 'TAGGED_BAIL_UPDATED'
    | 'TAGGED_BAIL_REMOVED'
}
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
      .map(a => a.daysTotal)
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
      const total = adjustments.map(a => a.daysTotal).reduce((sum, current) => sum + current, 0)
      const effective = adjustments.map(a => a.effectiveDays).reduce((sum, current) => sum + current, 0)
      return total - effective
    }
    return 0
  }
}

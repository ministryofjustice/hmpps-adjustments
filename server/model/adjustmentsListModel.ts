import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import config from '../config'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export type Message = {
  type: string
  days: number
  action: 'CREATE' | 'REMOVE' | 'UPDATE'
}
export default class AdjustmentsListViewModel {
  public adjustmentTypes = adjustmentTypes

  public messageType: AdjustmentType

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: Adjustment[],
    public relevantRemand: RemandResult,
    public message: Message,
  ) {
    this.messageType = message && this.adjustmentTypes.find(it => it.value === message.type)
  }

  public deductions(): AdjustmentType[] {
    return this.adjustmentTypes.filter(it =>
      [
        'REMAND',
        'TAGGED_BAIL',
        'LAWFULLY_AT_LARGE',
        'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
        'SPECIAL_REMISSION',
        'TIME_SPENT_IN_CUSTODY_ABROAD',
      ].includes(it.value),
    )
  }

  public additions(): AdjustmentType[] {
    return this.adjustmentTypes.filter(it => ['UNLAWFULLY_AT_LARGE', 'ADDITIONAL_DAYS_AWARDED'].includes(it.value))
  }

  public displayReview() {
    return (
      this.relevantRemand &&
      this.getTotalDays(adjustmentTypes.find(it => it.value === 'REMAND')) !== this.getTotalDaysRelevantRemand()
    )
  }

  public getTotalDays(adjustmentType: AdjustmentType) {
    return this.adjustments
      .filter(it => it.adjustmentType === adjustmentType.value)
      .map(a => a.days)
      .reduce((sum, current) => sum + current, 0)
  }

  public showDetails(adjustmentType: AdjustmentType) {
    return this.getTotalDays(adjustmentType) !== 0
  }

  public getTotalDaysRelevantRemand() {
    return this.relevantRemand.sentenceRemand.map(a => a.days).reduce((sum, current) => sum + current, 0)
  }

  public calculateReleaseDatesUrl() {
    return `${config.services.calculateReleaseDatesUI.url}/calculation/${this.prisonerDetail.offenderNo}/check-information`
  }
}

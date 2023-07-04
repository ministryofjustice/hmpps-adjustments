import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'
import ReviewModel from './reviewModel'

export default class RemoveModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    public adjustmentType: AdjustmentType,
  ) {}

  public summaryRows() {
    return ReviewModel.summaryRowsFromAdjustment(this.adjustment)
  }
}

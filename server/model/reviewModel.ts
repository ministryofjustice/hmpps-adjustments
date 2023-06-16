import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export default class ReviewModel {
  constructor(public prisonerDetail: PrisonApiPrisoner, public adjustments: AdjustmentDetails[]) {}

  adjustmentType(adjustment: AdjustmentDetails): AdjustmentType {
    return adjustmentTypes.find(it => it.value === adjustment.adjustmentType)
  }
}

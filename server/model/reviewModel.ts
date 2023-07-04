import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export default class ReviewModel {
  constructor(public prisonerDetail: PrisonApiPrisoner, public adjustment: Adjustment) {}

  adjustmentType(): AdjustmentType {
    return adjustmentTypes.find(it => it.value === this.adjustment.adjustmentType)
  }

  changeLink(): string {
    return `/${this.adjustment.person}/${this.adjustmentType().url}/edit${
      this.adjustment.id ? `/${this.adjustment.id}` : ''
    }`
  }
}

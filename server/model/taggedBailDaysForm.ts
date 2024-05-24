import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import ValidationError from './validationError'
import SessionAdjustment from '../@types/AdjustmentTypes'

export default class TaggedBailDaysForm extends AbstractForm<TaggedBailDaysForm> {
  days: string

  isEdit: boolean

  adjustmentId?: string

  toAdjustment(adjustment: Adjustment): SessionAdjustment {
    return { ...adjustment, days: Number(this.days), complete: true }
  }

  async validation(): Promise<ValidationError[]> {
    if (!this.days) {
      return [
        {
          text: 'Enter the number of days for the tagged bail',
          fields: ['days'],
        },
      ]
    }
    if (this.isNotPositiveInteger(this.days)) {
      return [
        {
          text: 'Enter a positive whole number for the number of days on tagged bail',
          fields: ['days'],
        },
      ]
    }
    return []
  }

  static fromAdjustment(adjustment: Adjustment): TaggedBailDaysForm {
    return new TaggedBailDaysForm({
      days: adjustment.days?.toString() || '',
    })
  }
}

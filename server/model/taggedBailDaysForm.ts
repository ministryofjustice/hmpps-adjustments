import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class TaggedBailDaysForm extends AbstractForm<TaggedBailDaysForm> {
  days: number

  isEdit: boolean

  adjustmentId?: string

  toAdjustment(adjustment: Adjustment): Adjustment {
    return { ...adjustment, days: this.days }
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
    if (Number(this.days) <= 0 || !Number.isInteger(Number(this.days))) {
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
      days: adjustment.days,
    })
  }
}

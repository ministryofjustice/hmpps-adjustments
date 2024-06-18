import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import ValidationError from './validationError'
import SessionAdjustment from '../@types/AdjustmentTypes'

export default class UnusedDeductionsDaysForm extends AbstractForm<UnusedDeductionsDaysForm> {
  days: string

  isEdit: boolean

  async validation(): Promise<ValidationError[]> {
    if (!this.days) {
      return [
        {
          text: 'Enter the number of days for unused deductions',
          fields: ['days'],
        },
      ]
    }
    if (this.isNotPositiveInteger(this.days)) {
      return [
        {
          text: 'Enter a positive whole number for the number of unused deductions',
          fields: ['days'],
        },
      ]
    }
    return []
  }

  static fromDays(days: number): UnusedDeductionsDaysForm {
    return new UnusedDeductionsDaysForm({
      days: days.toString() || '0',
    })
  }
}

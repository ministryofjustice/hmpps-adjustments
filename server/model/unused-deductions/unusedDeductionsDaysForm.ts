import SessionAdjustment from '../../@types/AdjustmentTypes'
import AbstractForm from '../abstractForm'
import ValidationError from '../validationError'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'

export default class UnusedDeductionsDaysForm extends AbstractForm<UnusedDeductionsDaysForm> {
  days: string

  totalRemandAndTaggedBailDays: number

  isEdit: boolean

  bookingId: number

  offenderId: string

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
    if (Number(this.days) > this.totalRemandAndTaggedBailDays) {
      return [
        {
          text: `The number of days cannot exceed the total number of deductions, which is ${this.totalRemandAndTaggedBailDays}`,
          fields: ['days'],
        },
      ]
    }
    return []
  }

  static toAdjustment(form: UnusedDeductionsDaysForm): SessionAdjustment {
    return {
      adjustmentType: 'UNUSED_DEDUCTIONS',
      bookingId: form.bookingId,
      person: form.offenderId,
      days: Number(form.days),
    }
  }

  static fromAdjustment(adjustment: Adjustment, days?: number): UnusedDeductionsDaysForm {
    return new UnusedDeductionsDaysForm({
      days: days ? days.toString() : adjustment.effectiveDays.toString() || '0',
      isEdit: true,
      bookingId: adjustment.bookingId,
    })
  }

  static fromOffenderId(offenderId: string, days?: number): UnusedDeductionsDaysForm {
    return new UnusedDeductionsDaysForm({
      days: days ? days.toString() : '0',
      isEdit: false,
      bookingId: 0,
      offenderId,
    })
  }
}

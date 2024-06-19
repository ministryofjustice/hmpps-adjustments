import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class UnusedDeductionsDaysForm extends AbstractForm<UnusedDeductionsDaysForm> {
  days: string

  totalRemandAndTaggedBailDays: number

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

  static fromDays(days: number, totalRemandAndTaggedBailDays: number, addOrEdit: string): UnusedDeductionsDaysForm {
    return new UnusedDeductionsDaysForm({
      days: days.toString() || '0',
      totalRemandAndTaggedBailDays,
      isEdit: addOrEdit === 'edit',
    })
  }
}

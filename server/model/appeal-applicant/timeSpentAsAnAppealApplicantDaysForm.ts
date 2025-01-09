import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import AbstractForm from '../abstractForm'
import ValidationError from '../validationError'
import SessionAdjustment from '../../@types/AdjustmentTypes'

export default class TimeSpentAsAnAppealApplicantDaysForm extends AbstractForm<TimeSpentAsAnAppealApplicantDaysForm> {
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
          text: 'Enter the number of days spent as an appeal applicant not to count',
          fields: ['days'],
        },
      ]
    }
    if (this.isNotPositiveInteger(this.days)) {
      return [
        {
          text: 'Enter a positive whole number for the number of days spent as an appeal applicant not to count',
          fields: ['days'],
        },
      ]
    }
    return []
  }

  static fromAdjustment(adjustment: Adjustment): TimeSpentAsAnAppealApplicantDaysForm {
    return new TimeSpentAsAnAppealApplicantDaysForm({
      days: adjustment.days?.toString() || '',
    })
  }
}

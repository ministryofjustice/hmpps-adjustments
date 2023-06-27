import dayjs from 'dayjs'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'
import { dateItems } from '../utils/utils'
import AbstractForm from './abstractForm'

export default class RestoredAdditionalDaysForm extends AbstractForm<RestoredAdditionalDaysForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  days: string

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', this.errors)
  }

  static fromAdjustment(adjustment: AdjustmentDetails): RestoredAdditionalDaysForm {
    return new RestoredAdditionalDaysForm({
      'from-day': dayjs(adjustment.fromDate).get('date').toString(),
      'from-month': (dayjs(adjustment.fromDate).get('month') + 1).toString(),
      'from-year': dayjs(adjustment.fromDate).get('year').toString(),
      days: adjustment.days.toString(),
    })
  }

  toAdjustmentDetails(bookingId: number, nomsId: string): AdjustmentDetails {
    return {
      adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
      bookingId,
      fromDate: dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD'),
      toDate: null,
      person: nomsId,
      days: Number(this.days),
      sentenceSequence: null,
    }
  }

  validation() {
    const errors = []
    const dateError = this.validateDate(this['from-day'], this['from-month'], this['from-year'], 'from')
    if (dateError) {
      errors.push(dateError)
    }
    if (!this.days || Number.isNaN(Number(this.days)) || Number(this.days) < 0) {
      errors.push({
        message: 'You must enter days',
        fields: ['days'],
      })
    }
    return errors
  }
}

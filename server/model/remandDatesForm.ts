import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import ValidationError from './validationError'
import { dateItems, isDateInFuture, isFromAfterTo } from '../utils/utils'

export default class RemandDatesForm extends AbstractForm<RemandDatesForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  'to-day': string

  'to-month': string

  'to-year': string

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', this.errors)
  }

  toItems() {
    return dateItems(this['to-year'], this['to-month'], this['to-day'], 'to', this.errors)
  }

  async validation(): Promise<ValidationError[]> {
    const errors = []
    const fromDateError = this.validateDate(this['from-day'], this['from-month'], this['from-year'], 'from')
    if (fromDateError) {
      errors.push(fromDateError)
    }
    const toDateError = this.validateDate(this['to-day'], this['to-month'], this['to-year'], 'to')
    if (toDateError) {
      errors.push(toDateError)
    }

    if (isDateInFuture(this['from-year'], this['from-month'], this['from-day']))
      errors.push({
        text: 'The first day of remand must not be in the future.',
        fields: ['from-day', 'from-month', 'from-year'],
      })

    if (isDateInFuture(this['to-year'], this['to-month'], this['to-day']))
      errors.push({
        text: 'The last day of remand must not be in the future.',
        fields: ['to-day', 'to-month', 'to-year'],
      })

    if (
      isFromAfterTo(
        this['from-year'],
        this['from-month'],
        this['from-day'],
        this['to-year'],
        this['to-month'],
        this['to-day'],
      )
    ) {
      errors.push({
        text: 'The first day of remand must be before the last day of remand.',
        fields: ['from-day', 'from-month', 'from-year', 'to-day', 'to-month', 'to-year'],
      })
    }
    return errors
  }

  static fromAdjustment(adjustment: Adjustment): RemandDatesForm {
    return new RemandDatesForm({
      'from-day': dayjs(adjustment.fromDate).get('date').toString(),
      'from-month': (dayjs(adjustment.fromDate).get('month') + 1).toString(),
      'from-year': dayjs(adjustment.fromDate).get('year').toString(),
      'to-day': dayjs(adjustment.toDate).get('date').toString(),
      'to-month': (dayjs(adjustment.toDate).get('month') + 1).toString(),
      'to-year': dayjs(adjustment.toDate).get('year').toString(),
    })
  }
}

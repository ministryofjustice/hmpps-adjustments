import dayjs from 'dayjs'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'
import { dateItems, fieldHasErrors } from '../utils/utils'
import ValidationError from './validationError'

export default class RestoredAdditionalDaysForm {
  constructor(params: Partial<RestoredAdditionalDaysForm>) {
    Object.assign(this, params)
  }

  errors: ValidationError[] = []

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
      fromDate: dayjs()
        .set('date', Number(this['from-day']))
        .set('month', Number(this['from-month']) - 1)
        .set('year', Number(this['from-year']))
        .format('YYYY-MM-DD'),
      toDate: null,
      person: nomsId,
      days: Number(this.days),
      sentenceSequence: null,
    }
  }

  validate() {
    const dateError = this.validateDate(this['from-day'], this['from-month'], this['from-year'], 'from')
    if (dateError) {
      this.errors.push(dateError)
    }
    if (!this.days || Number.isNaN(Number(this.days)) || Number(this.days) < 0) {
      this.errors.push({
        message: 'You must enter days',
        fields: ['days'],
      })
    }
  }

  private validateDate(day: string, month: string, year: string, fieldPrefix: string): ValidationError {
    if (!day && !month && !year) {
      return {
        message: 'The date entered must include a valid day, month and a year.',
        fields: [`${fieldPrefix}-day`, `${fieldPrefix}-month`, `${fieldPrefix}-year`],
      }
    }
    let message = 'The date entered must include a'
    const fields = []
    if (!day) {
      message += ' day'
      fields.push(`${fieldPrefix}-day`)
    }
    if (!month) {
      message += `${fields.length ? ' and' : ''} month`
      fields.push(`${fieldPrefix}-month`)
    }
    if (!year) {
      message += `${fields.length ? ' and' : ''} year`
      fields.push(`${fieldPrefix}-year`)
    }
    if (fields.length) {
      message += '.'
      return {
        message,
        fields,
      }
    }
    const date = dayjs(`${this['from-day']}-${this['from-month']}-${this['from-year']}`)
    if (!date.isValid()) {
      return {
        message: 'The date entered must include a valid day, month and a year.',
        fields: [`${fieldPrefix}-day`, `${fieldPrefix}-month`, `${fieldPrefix}-year`],
      }
    }
    return null
  }

  fieldHasError(field: string): boolean {
    return fieldHasErrors(this.errors, field)
  }

  messageForField(...fields: string[]): { text: string } {
    const error = this.errors.find(it => fields.find(field => it.fields.indexOf(field) !== -1))
    if (error) {
      return { text: error.message }
    }
    return null
  }
}

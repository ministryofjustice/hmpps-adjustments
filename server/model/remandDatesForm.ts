import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import ValidationError from './validationError'
import { dateItems, fieldsToDate, isDateInFuture, isFromAfterTo } from '../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

export default class RemandDatesForm extends AbstractForm<RemandDatesForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  'to-day': string

  'to-month': string

  'to-year': string

  toAdjustment(adjustment: Adjustment): Adjustment {
    const fromDate = dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD')
    const toDate = dayjs(`${this['to-year']}-${this['to-month']}-${this['to-day']}`).format('YYYY-MM-DD')
    return { ...adjustment, fromDate, toDate }
  }

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', this.errors)
  }

  toItems() {
    return dateItems(this['to-year'], this['to-month'], this['to-day'], 'to', this.errors)
  }

  async validation(getSentences?: () => Promise<PrisonApiOffenderSentenceAndOffences[]>): Promise<ValidationError[]> {
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

    const activeSentences = await getSentences()
    const sentencesWithOffenceDates = activeSentences.filter(it => it.offences.filter(o => o.offenceStartDate).length)

    if (sentencesWithOffenceDates.length) {
      const minOffenceDate = this.getMinOffenceDate(sentencesWithOffenceDates)
      const fromDate = fieldsToDate(this['from-year'], this['from-month'], this['from-day'])
      if (fromDate < minOffenceDate) {
        errors.push({
          text: `The remand period cannot start before the earliest offence date, on ${dayjs(minOffenceDate).format(
            'DD MMM YYYY',
          )}`,
          fields: ['from-day', 'from-month', 'from-year'],
        })
      }
    }

    return errors
  }

  private getMinOffenceDate(sentencesWithOffenceDates: PrisonApiOffenderSentenceAndOffences[]) {
    return sentencesWithOffenceDates
      .map(
        it =>
          new Date(
            it.offences
              .filter(o => o.offenceStartDate)
              .reduce((a, b) => (new Date(a.offenceStartDate) < new Date(b.offenceStartDate) ? a : b)).offenceStartDate,
          ),
      )
      .reduce((a, b) => (a < b ? a : b))
  }

  static fromAdjustment(adjustment: Adjustment): RemandDatesForm {
    return new RemandDatesForm({
      'from-day': adjustment.fromDate ? dayjs(adjustment.fromDate).get('date').toString() : null,
      'from-month': adjustment.fromDate ? (dayjs(adjustment.fromDate).get('month') + 1).toString() : null,
      'from-year': adjustment.fromDate ? dayjs(adjustment.fromDate).get('year').toString() : null,
      'to-day': adjustment.toDate ? dayjs(adjustment.toDate).get('date').toString() : null,
      'to-month': adjustment.toDate ? (dayjs(adjustment.toDate).get('month') + 1).toString() : null,
      'to-year': adjustment.toDate ? dayjs(adjustment.toDate).get('year').toString() : null,
    })
  }
}

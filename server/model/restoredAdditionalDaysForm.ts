import dayjs from 'dayjs'
import { EditableAdjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateItems } from '../utils/utils'
import AdjustmentsForm from './adjustmentsForm'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'
import { Prisoner } from '../@types/prisonSearchApi/types'

export default class RestoredAdditionalDaysForm extends AdjustmentsForm<RestoredAdditionalDaysForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  days: string

  toAdjustment(prisonerDetails: Prisoner, nomsId: string, id: string): EditableAdjustment {
    return {
      id,
      adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
      bookingId: parseInt(prisonerDetails.bookingId, 10),
      fromDate: dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD'),
      toDate: null,
      person: nomsId,
      days: Number(this.days),
      sentenceSequence: null,
      prisonId: prisonerDetails.prisonId,
    }
  }

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', this.errors)
  }

  async validation() {
    const errors = []
    const dateError = this.validateDate(this['from-day'], this['from-month'], this['from-year'], 'from')
    if (dateError) {
      errors.push(dateError)
    }
    if (!this.days) {
      errors.push({
        text: 'The number of days restored must be entered.',
        fields: ['days'],
      })
    } else if (this.isNotPositiveInteger(this.days)) {
      errors.push({
        text: 'Enter a valid number of additional days restored.',
        fields: ['days'],
      })
    }
    return errors
  }

  adjustmentType(): AdjustmentType {
    return adjustmentTypes.find(it => it.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED')
  }

  fragment(): string {
    return './restoredAdditionalDays.njk'
  }
}

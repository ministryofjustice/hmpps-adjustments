import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateItems } from '../utils/utils'
import AdjustmentsForm from './adjustmentsForm'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class RestoredAdditionalDaysForm extends AdjustmentsForm<RestoredAdditionalDaysForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  days: string

  toAdjustment(prisonerDetails: PrisonApiPrisoner, nomsId: string, id: string): Adjustment {
    return {
      id,
      adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
      bookingId: prisonerDetails.bookingId,
      fromDate: dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD'),
      toDate: null,
      person: nomsId,
      days: Number(this.days),
      sentenceSequence: null,
      prisonId: prisonerDetails.agencyId,
    }
  }

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', this.errors)
  }

  validation() {
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

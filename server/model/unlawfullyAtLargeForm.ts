import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateItems, isDateInFuture } from '../utils/utils'
import AdjustmentsForm from './adjustmentsForm'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'
import ualType from './ualType'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class UnlawfullyAtLargeForm extends AdjustmentsForm<UnlawfullyAtLargeForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  'to-day': string

  'to-month': string

  'to-year': string

  type: 'RECALL' | 'ESCAPE' | 'SENTENCED_IN_ABSENCE' | 'RELEASE_IN_ERROR'

  toAdjustment(prisonerDetails: PrisonApiPrisoner, nomsId: string, id: string): Adjustment {
    const fromDate = dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD')
    const toDate = dayjs(`${this['to-year']}-${this['to-month']}-${this['to-day']}`).format('YYYY-MM-DD')
    return {
      id,
      adjustmentType: 'UNLAWFULLY_AT_LARGE',
      bookingId: prisonerDetails.bookingId,
      fromDate,
      toDate,
      person: nomsId,
      unlawfullyAtLarge: { type: this.type },
      prisonId: prisonerDetails.agencyId,
    }
  }

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', this.errors)
  }

  toItems() {
    return dateItems(this['to-year'], this['to-month'], this['to-day'], 'to', this.errors)
  }

  typesOfUAL() {
    return ualType.map(it => {
      return { ...it, checked: this.type === it.value }
    })
  }

  async validation() {
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
        text: 'The first day of unlawfully at large date must not be in the future',
        fields: ['from'],
      })

    if (isDateInFuture(this['to-year'], this['to-month'], this['to-day']))
      errors.push({
        text: 'The last day of unlawfully at large date must not be in the future',
        fields: ['to'],
      })

    if (!this.type)
      errors.push({
        text: 'You must select the type of UAL',
        fields: ['type'],
      })

    return errors
  }

  adjustmentType(): AdjustmentType {
    return adjustmentTypes.find(it => it.value === 'UNLAWFULLY_AT_LARGE')
  }

  fragment(): string {
    return './unlawfullyAtLarge.njk'
  }
}

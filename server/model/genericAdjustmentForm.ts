import dayjs from 'dayjs'
import { AdjustmentTypes, EditableAdjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateItems } from '../utils/utils'
import AdjustmentsForm from './adjustmentsForm'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import ValidationError from './validationError'

export type GenericAdjustmentFormOptions = {
  hasToDate: boolean
  hasSentence: boolean
  adjustmentType: AdjustmentTypes
}
export default class GenericAdjustmentForm extends AdjustmentsForm<GenericAdjustmentForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  'to-day': string

  'to-month': string

  'to-year': string

  days: string

  sentence: string

  options: GenericAdjustmentFormOptions

  toAdjustment(prisonerDetails: PrisonApiPrisoner, nomsId: string, id: string): EditableAdjustment {
    return {
      id,
      adjustmentType: this.options.adjustmentType,
      bookingId: prisonerDetails.bookingId,
      fromDate: dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD'),
      toDate: this.options.hasToDate
        ? dayjs(`${this['to-year']}-${this['to-month']}-${this['to-day']}`).format('YYYY-MM-DD')
        : null,
      person: nomsId,
      days: this.options.hasToDate ? null : Number(this.days),
      sentenceSequence: this.options.hasSentence ? Number(this.sentence) : null,
      prisonId: prisonerDetails.agencyId,
    }
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
    if (this.options.hasToDate) {
      const toDateError = this.validateDate(this['to-day'], this['to-month'], this['to-year'], 'to')
      if (toDateError) {
        errors.push(toDateError)
      }
    } else if (!this.days) {
      errors.push({
        text: 'You must enter days',
        fields: ['days'],
      })
    } else if (this.isNotPositiveInteger(this.days)) {
      errors.push({
        text: 'Enter a valid number of days',
        fields: ['days'],
      })
    }
    if (this.options.hasSentence) {
      if (!this.sentence) {
        errors.push({
          text: 'You must enter a sentence sequence',
          fields: ['sentence'],
        })
      } else if (this.isNotPositiveInteger(this.sentence)) {
        errors.push({
          text: 'Enter a valid sentence sequence',
          fields: ['sentence'],
        })
      } else {
        const sentences = await getSentences()
        const sequences = sentences.filter(it => it.sentenceStatus === 'A').map(it => it.sentenceSequence)
        if (sequences.indexOf(Number(this.sentence)) === -1) {
          errors.push({
            text: `The sentence sequence ${this.sentence} does not exist on the active booking.`,
            fields: ['sentence'],
          })
        }
      }
    }
    return errors
  }

  adjustmentType(): AdjustmentType {
    return adjustmentTypes.find(it => it.value === this.options.adjustmentType)
  }

  fragment(): string {
    return './genericForm.njk'
  }
}

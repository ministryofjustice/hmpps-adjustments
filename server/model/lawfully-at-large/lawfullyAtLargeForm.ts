import dayjs from 'dayjs'
import { areIntervalsOverlapping } from 'date-fns'
import AdjustmentsForm from '../adjustmentsForm'
import { PrisonerSearchApiPrisoner } from '../../@types/prisonerSearchApi/prisonerSearchTypes'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { dateItems, dateToString, fieldsToDate, isDateInFuture, isFromAfterTo } from '../../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import ValidationError from '../validationError'
import adjustmentTypes, { AdjustmentType } from '../adjustmentTypes'
import lalAffectsReleaseDates from './lalAffectsReleaseDates'

export default class LawfullyAtLargeForm extends AdjustmentsForm<LawfullyAtLargeForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  'to-day': string

  'to-month': string

  'to-year': string

  isEdit: boolean

  adjustmentId?: string

  affectsDates: 'YES' | 'NO'

  toAdjustment(prisonerDetails: PrisonerSearchApiPrisoner, nomsId: string, id: string): Adjustment {
    const fromDate = dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD')
    const toDate = dayjs(`${this['to-year']}-${this['to-month']}-${this['to-day']}`).format('YYYY-MM-DD')
    return {
      id,
      adjustmentType: 'LAWFULLY_AT_LARGE',
      bookingId: parseInt(prisonerDetails.bookingId, 10),
      fromDate,
      toDate,
      person: nomsId,
      lawfullyAtLarge: { affectsDates: this.affectsDates },
      prisonId: prisonerDetails.prisonId,
    }
  }

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', this.errors)
  }

  toItems() {
    return dateItems(this['to-year'], this['to-month'], this['to-day'], 'to', this.errors)
  }

  lalAffectsReleaseDates() {
    return lalAffectsReleaseDates.map(it => {
      return { ...it, checked: this.affectsDates === it.value }
    })
  }

  async validation(
    getSentences?: () => Promise<PrisonApiOffenderSentenceAndOffences[]>,
    getAdjustments?: () => Promise<Adjustment[]>,
  ): Promise<ValidationError[]> {
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
        text: 'The first day of lawfully at large date must not be in the future',
        fields: ['from-day', 'from-month', 'from-year'],
      })

    if (isDateInFuture(this['to-year'], this['to-month'], this['to-day']))
      errors.push({
        text: 'The last day of lawfully at large date must not be in the future',
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
        text: 'The first day of lawfully at large must be before the last day of lawfully at large.',
        fields: ['from-day', 'from-month', 'from-year', 'to-day', 'to-month', 'to-year'],
      })
    }

    const activeSentences = await getSentences()
    const sentencesWithOffenceDates = activeSentences.filter(it => it.offences.filter(o => o.offenceStartDate).length)

    if (sentencesWithOffenceDates.length) {
      const fromDate = fieldsToDate(this['from-day'], this['from-month'], this['from-year'])
      const minSentenceDate = this.getMinSentenceDate(sentencesWithOffenceDates)
      if (fromDate < minSentenceDate) {
        errors.push({
          text: `The lawfully at large period cannot start before the earliest sentence date, on ${dayjs(minSentenceDate).format('D MMMM YYYY')}`,
          fields: ['from-day', 'from-month', 'from-year'],
        })
      }
    }

    // Edit specific validation
    if (this.isEdit) {
      errors.push(...(await this.validationForEdit(getAdjustments)))
    }

    if (!this.affectsDates)
      errors.push({
        text: "You must select if the LAL period will defer this person's release dates",
        fields: ['affectsDates'],
      })

    return errors
  }

  private async validationForEdit(getAdjustments?: () => Promise<Adjustment[]>): Promise<ValidationError[]> {
    const errors = []
    const fromDate = fieldsToDate(this['from-day'], this['from-month'], this['from-year'])
    const toDate = fieldsToDate(this['to-day'], this['to-month'], this['to-year'])
    const adjustments = (await getAdjustments()).filter(
      it => it.adjustmentType === 'LAWFULLY_AT_LARGE' && it.id !== this.adjustmentId,
    )
    const overlappingAdjustment = adjustments.find(a =>
      areIntervalsOverlapping(
        { start: new Date(a.fromDate), end: new Date(a.toDate) },
        { start: fromDate, end: toDate },
        { inclusive: true },
      ),
    )

    if (overlappingAdjustment) {
      errors.push({
        text: `The lawfully at large dates overlap with another lawfully at large period ${dateToString(
          new Date(overlappingAdjustment.fromDate),
        )} to ${dateToString(new Date(overlappingAdjustment.toDate))}`,
        fields: ['from-day', 'from-month', 'from-year', 'to-day', 'to-month', 'to-year'],
      })
    }
    return errors
  }

  private getMinSentenceDate(sentencesWithOffenceDates: PrisonApiOffenderSentenceAndOffences[]) {
    return new Date(
      sentencesWithOffenceDates.reduce((a, b) => (new Date(a.sentenceDate) < new Date(b.sentenceDate) ? a : b))
        .sentenceDate,
    )
  }

  adjustmentType(): AdjustmentType {
    return adjustmentTypes.find(it => it.value === 'LAWFULLY_AT_LARGE')
  }

  fragment(): string {
    return './lawfullyAtLarge.njk'
  }
}

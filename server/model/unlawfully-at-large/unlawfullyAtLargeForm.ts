import dayjs from 'dayjs'
import { areIntervalsOverlapping } from 'date-fns'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { dateItems, dateToString, fieldsToDate, isDateInFuture, isFromAfterTo } from '../../utils/utils'
import AdjustmentsForm from '../adjustmentsForm'
import adjustmentTypes, { AdjustmentType } from '../adjustmentTypes'
import ualType from './ualType'
import { PrisonerSearchApiPrisoner } from '../../@types/prisonerSearchApi/prisonerSearchTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import ValidationError from '../validationError'

export default class UnlawfullyAtLargeForm extends AdjustmentsForm<UnlawfullyAtLargeForm> {
  'from-day': string

  'from-month': string

  'from-year': string

  'to-day': string

  'to-month': string

  'to-year': string

  isEdit: boolean

  adjustmentId?: string

  type: 'RECALL' | 'ESCAPE' | 'SENTENCED_IN_ABSENCE' | 'RELEASE_IN_ERROR' | 'IMMIGRATION_DETENTION'

  toAdjustment(prisonerDetails: PrisonerSearchApiPrisoner, nomsId: string, id: string): Adjustment {
    const fromDate = dayjs(`${this['from-year']}-${this['from-month']}-${this['from-day']}`).format('YYYY-MM-DD')
    const toDate = dayjs(`${this['to-year']}-${this['to-month']}-${this['to-day']}`).format('YYYY-MM-DD')
    return {
      id,
      adjustmentType: 'UNLAWFULLY_AT_LARGE',
      bookingId: parseInt(prisonerDetails.bookingId, 10),
      fromDate,
      toDate,
      person: nomsId,
      unlawfullyAtLarge: { type: this.type },
      prisonId: prisonerDetails.prisonId,
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
        text: 'The first day of unlawfully at large date must not be in the future',
        fields: ['from-day', 'from-month', 'from-year'],
      })

    if (isDateInFuture(this['to-year'], this['to-month'], this['to-day']))
      errors.push({
        text: 'The last day of unlawfully at large date must not be in the future',
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
        text: 'The first day of unlawfully at large must be before the last day of unlawfully at large.',
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
          text: `The unlawfully at large period cannot start before the earliest sentence date, on ${dayjs(minSentenceDate).format('D MMMM YYYY')}`,
          fields: ['from-day', 'from-month', 'from-year'],
        })
      }
    }

    const adjustments = (await getAdjustments()).filter(a => a.adjustmentType === 'UNLAWFULLY_AT_LARGE')

    const matchingAdjustments = adjustments
      .map(adjustment =>
        this.isDateInAdjustmentRange(adjustment, this['from-year'], this['from-month'], this['from-day']),
      )
      .filter((a): a is Adjustment => a !== null)

    if (matchingAdjustments.length > 0) {
      const dateFormat = 'D MMMM YYYY'
      const formatInputDate = (year: string, month: string, day: string) =>
        dayjs(`${year}-${month}-${day}`).format(dateFormat)

      const formattedInputFrom = formatInputDate(this['from-year'], this['from-month'], this['from-day'])
      const formattedInputTo = formatInputDate(this['to-year'], this['to-month'], this['to-day'])

      const fields = ['from-day', 'from-month', 'from-year', 'to-day', 'to-month', 'to-year']

      matchingAdjustments.forEach(adjustment => {
        const formattedAdjFrom = dayjs(adjustment.fromDate).format(dateFormat)
        const formattedAdjTo = dayjs(adjustment.toDate).format(dateFormat)

        errors.push({
          text: `The UAL dates from ${formattedInputFrom} to ${formattedInputTo} overlaps with another UAL period from ${formattedAdjFrom} to ${formattedAdjTo}.`,
          fields,
        })
      })

      errors.push({
        text: `To continue, edit or remove the UAL days that overlap.`,
        fields,
      })
    }

    // Edit specific validation
    if (this.isEdit) {
      errors.push(...(await this.validationForEdit(getAdjustments)))
    }

    if (!this.type)
      errors.push({
        text: 'You must select the type of unlawfully at large',
        fields: ['type'],
      })

    return errors
  }

  isDateInAdjustmentRange(
    adjustment: Adjustment,
    fromYear: string,
    fromMonth: string,
    fromDay: string,
  ): Adjustment | null {
    const inputDate = new Date(`${fromYear.padStart(4, '0')}-${fromMonth.padStart(2, '0')}-${fromDay.padStart(2, '0')}`)
    const fromDate = adjustment.fromDate ? new Date(adjustment.fromDate) : null
    const toDate = adjustment.toDate ? new Date(adjustment.toDate) : null

    const isWithinRange =
      (fromDate && toDate && inputDate >= fromDate && inputDate <= toDate) ||
      (fromDate && !toDate && inputDate >= fromDate) ||
      (!fromDate && toDate && inputDate <= toDate)

    return isWithinRange ? adjustment : null
  }

  private async validationForEdit(getAdjustments?: () => Promise<Adjustment[]>): Promise<ValidationError[]> {
    const errors = []
    const fromDate = fieldsToDate(this['from-day'], this['from-month'], this['from-year'])
    const toDate = fieldsToDate(this['to-day'], this['to-month'], this['to-year'])
    const adjustments = (await getAdjustments()).filter(
      it => it.adjustmentType === 'UNLAWFULLY_AT_LARGE' && it.id !== this.adjustmentId,
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
        text: `The unlawfully at large dates overlap with another unlawfully at large period ${dateToString(
          new Date(overlappingAdjustment.fromDate),
        )} to ${dateToString(new Date(overlappingAdjustment.toDate))}`,
        fields: ['from-day', 'from-month', 'from-year', 'to-day', 'to-month', 'to-year'],
      })
    }
    return errors
  }

  private getMinSentenceDate(sentencesWithOffenceDates: PrisonApiOffenderSentenceAndOffences[]) {
    return new Date(
      sentencesWithOffenceDates.reduce((a, b) =>
        new Date(a.sentenceDate) < new Date(b.sentenceDate) ? a : b,
      ).sentenceDate,
    )
  }

  adjustmentType(): AdjustmentType {
    return adjustmentTypes.find(it => it.value === 'UNLAWFULLY_AT_LARGE')
  }

  fragment(): string {
    return './unlawfullyAtLarge.njk'
  }
}

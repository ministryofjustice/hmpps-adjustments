import dayjs from 'dayjs'
import ValidationError from '../model/validationError'
import config from '../config'
import {
  PrisonApiOffence,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
} from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const dateItems = (year: string, month: string, day: string, prefix: string, errors: ValidationError[]) => {
  return [
    {
      name: `day`,
      classes: `govuk-input--width-2${fieldHasErrors(errors, `${prefix}-day`) ? ' govuk-input--error' : ''}`,
      value: day,
    },
    {
      name: `month`,
      classes: `govuk-input--width-2${fieldHasErrors(errors, `${prefix}-month`) ? ' govuk-input--error' : ''}`,
      value: month,
    },
    {
      name: `year`,
      classes: `govuk-input--width-4${fieldHasErrors(errors, `${prefix}-year`) ? ' govuk-input--error' : ''}`,
      value: year,
    },
  ]
}

export const fieldHasErrors = (errors: ValidationError[], field: string) => {
  return !!errors.find(error => error.fields.indexOf(field) !== -1)
}

// This date arithmetic is inclusive  of both end boundaries, e.g. 2023-01-01 to 2023-01-01 is 1 day
export const daysBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / (1000 * 3600 * 24) + 1

export const isDateInFuture = (year: string, month: string, day: string) => {
  const today = new Date(new Date().toISOString().substring(0, 10))
  const date = new Date(dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD'))
  return date > today
}

export const isFromAfterTo = (
  fromYear: string,
  fromMonth: string,
  fromDay: string,
  toYear: string,
  toMonth: string,
  toDay: string,
) => {
  const fromDate = new Date(dayjs(`${fromYear}-${fromMonth}-${fromDay}`).format('YYYY-MM-DD'))
  const toDate = new Date(dayjs(`${toYear}-${toMonth}-${toDay}`).format('YYYY-MM-DD'))
  return fromDate > toDate
}

export const groupBy = <T, K>(items: T[], groupingFunction: (item: T) => K): Map<K, T[]> => {
  return items.reduce((result, item) => {
    const key = groupingFunction(item)
    const currentValues = result.get(key) || []
    currentValues.push(item)
    result.set(key, currentValues)
    return result
  }, new Map<K, T[]>())
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export function calculateReleaseDatesCheckInformationUrl(prisonerDetail: PrisonApiPrisoner) {
  return `${config.services.calculateReleaseDatesUI.url}/calculation/${prisonerDetail.offenderNo}/reason`
}

export const fieldsToDate = (day: string, month: string, year: string): Date =>
  new Date(dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD'))

export const dateToString = (date: Date): string => dayjs(date).format('DD MMM YYYY')

export function offencesForAdjustment(
  adjustment: Adjustment,
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
): PrisonApiOffence[] {
  return sentencesAndOffences.flatMap(so => {
    return so.offences.filter(off => {
      if (adjustment.remand?.chargeId?.length) {
        return adjustment.remand?.chargeId.includes(off.offenderChargeId)
      }
      return adjustment.sentenceSequence === so.sentenceSequence
    })
  })
}

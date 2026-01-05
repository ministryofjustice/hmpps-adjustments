import dayjs from 'dayjs'
import ValidationError from '../model/validationError'
import config from '../config'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import {
  CalculateReleaseDatesValidationMessage,
  UnusedDeductionCalculationResponse,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import RemandAndSentencingService from '../services/remandAndSentencingService'

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
      attributes: { maxLength: 2 },
    },
    {
      name: `month`,
      classes: `govuk-input--width-2${fieldHasErrors(errors, `${prefix}-month`) ? ' govuk-input--error' : ''}`,
      value: month,
      attributes: { maxLength: 2 },
    },
    {
      name: `year`,
      classes: `govuk-input--width-4${fieldHasErrors(errors, `${prefix}-year`) ? ' govuk-input--error' : ''}`,
      value: year,
      attributes: { maxLength: 4 },
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

export function calculateReleaseDatesCheckInformationUrl(prisonerNumber: string) {
  return `${config.services.calculateReleaseDatesUI.url}/calculation/${prisonerNumber}/reason`
}

export const fieldsToDate = (day: string, month: string, year: string): Date =>
  new Date(dayjs(`${year}-${month}-${day}`).format('YYYY-MM-DD'))

export const dateToString = (date: Date): string => dayjs(date).format('D MMMM YYYY')

export function offencesForRemandAdjustment(
  adjustment: Adjustment,
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  remandAndSentencingService: RemandAndSentencingService,
): (PrisonApiOffence & { courtDescription: string; recall?: boolean })[] {
  return sentencesAndOffences.flatMap(so => {
    const isRecalled = remandAndSentencingService.isSentenceRecalled(so.sentenceCalculationType) // Assuming a synchronous alternative
    return so.offences
      .filter(off => {
        if (adjustment.remand?.chargeId?.length) {
          return adjustment.remand?.chargeId.includes(off.offenderChargeId)
        }
        return adjustment.sentenceSequence === so.sentenceSequence
      })
      .map(off => {
        return { ...off, courtDescription: so.courtDescription, recall: isRecalled }
      })
  })
}

export function offencesForTimeSpentInCustodyAbroadAdjustment(
  adjustment: Adjustment,
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
): (PrisonApiOffence & { courtDescription: string })[] {
  return sentencesAndOffences.flatMap(so => {
    return so.offences
      .filter(off => {
        if (adjustment.timeSpentInCustodyAbroad?.chargeIds?.length) {
          return adjustment.timeSpentInCustodyAbroad?.chargeIds.includes(off.offenderChargeId)
        }
        return adjustment.sentenceSequence === so.sentenceSequence
      })
      .map(off => {
        return { ...off, courtDescription: so.courtDescription }
      })
  })
}

export function offencesForTimeSpentAsAnAppealApplicantAdjustment(
  adjustment: Adjustment,
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
): (PrisonApiOffence & { courtDescription: string })[] {
  return sentencesAndOffences.flatMap(so => {
    return so.offences
      .filter(off => {
        if (adjustment.timeSpentAsAnAppealApplicant?.chargeIds?.length) {
          return adjustment.timeSpentAsAnAppealApplicant?.chargeIds.includes(off.offenderChargeId)
        }
        return adjustment.sentenceSequence === so.sentenceSequence
      })
      .map(off => {
        return { ...off, courtDescription: so.courtDescription }
      })
  })
}

/**
 * Type used to organise sentences and offences by caseSequence.
 */
export type SentencesByCaseSequence = {
  caseSequence: number
  sentences: PrisonApiOffenderSentenceAndOffences[]
}

/**
 * Returns the HTML for the sentence recall tag.
 */
export function getSentenceRecallTagHTML(): string {
  return '<span class="moj-badge moj-badge--grey moj-badge--recall">RECALL</span>'
}

/**
 * Takes a list of sentences and offences and converts them to a collection of active sentences for each case sequence.
 * @param sentencesAndOffences sentences and offences to be converted.
 * @returns a collection of active sentences for each case sequence.
 */
export function getActiveSentencesByCaseSequence(
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
): SentencesByCaseSequence[] {
  return sentencesAndOffences
    .filter(it => it.sentenceStatus === 'A')
    .reduce((acc: SentencesByCaseSequence[], cur) => {
      if (acc.some(it => it.caseSequence === cur.caseSequence)) {
        const record = acc.find(it => it.caseSequence === cur.caseSequence)
        record.sentences.push(cur)
      } else {
        acc.push({ caseSequence: cur.caseSequence, sentences: [cur] } as SentencesByCaseSequence)
      }
      return acc
    }, [])
}

/**
 * Takes a list of sentences and offences and returns the most recent one based on sentence date.
 * @param sentencesAndOffences sentences and offences to filter.
 * @returns The most recent sentence and offence.
 */
export function getMostRecentSentenceAndOffence(
  sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
): PrisonApiOffenderSentenceAndOffences {
  return sentencesAndOffences.sort((a, b) => new Date(a.sentenceDate).getTime() - new Date(b.sentenceDate).getTime())[0]
}

/**
 * Takes the calculated unused deductions and checks the days against adjustments of type 'UNUSED_DEDUCTION'.
 * @param currentAdjustments The current adjustments.
 * @param calculatedUnusedDeductions The calculated unused deductions.
 * @returns Whether the calculated unused deduction days differ from the adjustments of type 'UNUSED_DEDUCTION' days.
 */
export function hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays(
  currentAdjustments: Adjustment[],
  calculatedUnusedDeductions: UnusedDeductionCalculationResponse,
): boolean {
  if (calculatedUnusedDeductions?.unusedDeductions != null) {
    const currentUnusedDeductions = currentAdjustments
      .filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
      .map(it => it.effectiveDays)
      .reduce((sum, current) => sum + current, 0)

    const toBeUnusedDeductions = calculatedUnusedDeductions.unusedDeductions

    return toBeUnusedDeductions !== currentUnusedDeductions
  }
  return false
}

export function relevantSentenceForTaggedBailAdjustment(it: SentencesByCaseSequence, adjustment: Adjustment): boolean {
  return adjustment.taggedBail?.caseSequence
    ? it.caseSequence === adjustment.taggedBail?.caseSequence
    : it.sentences.some(sent => sent.sentenceSequence === adjustment.sentenceSequence)
}

export function formatDate(date: string | Date | number, format: string = 'D MMMM YYYY'): string {
  return dayjs(date).format(format)
}

export function getCommittedText(offence: PrisonApiOffence, noWrapDate: boolean): string {
  let committedText
  if (offence.offenceEndDate && offence.offenceStartDate && offence.offenceEndDate !== offence.offenceStartDate) {
    committedText = `Committed from ${formatNoWrapDate(offence.offenceStartDate, noWrapDate)} to ${formatNoWrapDate(offence.offenceEndDate, noWrapDate)}`
  } else if (offence.offenceStartDate) {
    committedText = `Committed on ${formatNoWrapDate(offence.offenceStartDate, noWrapDate)}`
  } else if (offence.offenceEndDate) {
    committedText = `Committed on ${formatNoWrapDate(offence.offenceEndDate, noWrapDate)}`
  } else {
    committedText = 'Offence date not entered'
  }
  return committedText
}

export function formatNoWrapDate(date: string, noWrapDate: boolean) {
  const formattedDate = formatDate(date)
  return noWrapDate ? `<span class="govuk-!-white-space-nowrap">${formattedDate}</span> ` : formattedDate
}

export function getSummaryHtmlForOffences(
  offences: (PrisonApiOffence & { courtDescription: string; recall?: boolean })[],
) {
  return `<div> 
                    ${offences
                      .map(it => {
                        return `<div><span class="govuk-!-font-weight-bold">${it.offenceDescription}</span>${it.recall ? getSentenceRecallTagHTML() : ''}<br>
                        <span class="govuk-body-s">
                          ${getCommittedText(it, true)}
                        </span><br>
                        <span class="govuk-body-s">
                          Heard at ${it.courtDescription}
                        </span>
                        </div>`
                      })
                      .join('')}
                  </div>`
}

export function remandRelatedValidationSummary(messages: CalculateReleaseDatesValidationMessage[]) {
  const remandRelatedValidationCodes = ['REMAND_OVERLAPS_WITH_REMAND', 'REMAND_OVERLAPS_WITH_SENTENCE']

  const remandRelatedMessages = (messages || []).filter(it => remandRelatedValidationCodes.includes(it.code))

  const message = remandRelatedMessages.length ? remandRelatedMessages[0] : null
  if (!message) {
    return {
      errorList: [] as string[],
    }
  }
  const overlapsWithRemand = message.code === 'REMAND_OVERLAPS_WITH_REMAND'
  return {
    titleText: overlapsWithRemand
      ? 'Remand time cannot overlap'
      : 'Remand cannot be applied when a sentence is being served.',
    errorList: [
      {
        text: `The remand dates from ${dayjs(message.arguments[2]).format('D MMMM YYYY')} to ${dayjs(
          message.arguments[3],
        ).format('D MMMM YYYY')} overlaps with ${
          overlapsWithRemand ? 'another remand period from' : 'the sentence starting on'
        } ${dayjs(message.arguments[0]).format('D MMMM YYYY')} ${
          overlapsWithRemand ? 'to' : 'with a release date of the'
        } ${dayjs(message.arguments[1]).format('D MMMM YYYY')}`,
      },
    ],
    subText: {
      html: overlapsWithRemand
        ? '<p>To continue, edit the remand days that overlap or Cancel.</p>'
        : `<p>Update the remand dates to continue.</p>`,
    },
  }
}

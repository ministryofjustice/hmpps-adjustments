import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Adjustment, ValidationMessage } from '../@types/adjustments/adjustmentsTypes'
import { fieldHasErrors } from '../utils/utils'
import ValidationError from './validationError'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

dayjs.extend(customParseFormat)

export default abstract class AbstractForm<T> {
  constructor(params: Partial<T>) {
    Object.assign(this, params)
  }

  errors: ValidationError[] = []

  async validate(
    getSentences?: () => Promise<PrisonApiOffenderSentenceAndOffences[]>,
    getAdjustments?: () => Promise<Adjustment[]>,
  ): Promise<void> {
    this.errors = await this.validation(getSentences, getAdjustments)
  }

  abstract validation(
    getSentences?: () => Promise<PrisonApiOffenderSentenceAndOffences[]>,
    getAdjustments?: () => Promise<Adjustment[]>,
  ): Promise<ValidationError[]>

  protected validateDate(day: string, month: string, year: string, fieldPrefix: string): ValidationError {
    if (!day && !month && !year) {
      return {
        text: 'This date must include a valid day, month and year.',
        fields: [`${fieldPrefix}-day`, `${fieldPrefix}-month`, `${fieldPrefix}-year`],
      }
    }

    if (year.length !== 4) {
      return {
        text: 'Year must include 4 numbers',
        fields: [`${fieldPrefix}-year`],
      }
    }

    let text = 'This date must include a'
    const fields = []
    if (!day) {
      text += ' day'
      fields.push(`${fieldPrefix}-day`)
    }
    if (!month) {
      text += `${fields.length ? ' and' : ''} month`
      fields.push(`${fieldPrefix}-month`)
    }
    if (!year) {
      text += `${fields.length ? ' and' : ''} year`
      fields.push(`${fieldPrefix}-year`)
    }
    if (fields.length) {
      text += '.'
      return {
        text,
        fields,
      }
    }
    const date = dayjs(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 'YYYY-MM-DD', true)
    if (!date.isValid()) {
      return {
        text: 'This date does not exist.',
        fields: [`${fieldPrefix}-day`, `${fieldPrefix}-month`, `${fieldPrefix}-year`],
      }
    }
    return null
  }

  isNotPositiveInteger(value: string): boolean {
    return Number.isNaN(Number(value)) || Number(value) <= 0 || !Number.isInteger(Number(value))
  }

  fieldHasError(field: string): boolean {
    return fieldHasErrors(this.errors, field)
  }

  messageForField(...fields: string[]): { text: string } {
    const error = this.errors.find(it => fields.find(field => it.fields.indexOf(field) !== -1))
    if (error) {
      return { text: error.text }
    }
    return null
  }

  addErrors(validationMessages: ValidationMessage[]) {
    this.errors = validationMessages.map(it => {
      return {
        fields: [],
        html: `<div${it.message.indexOf('\n') !== -1 ? ' class="govuk-!-margin-bottom-2"' : ''}>
          ${it.message.replace('\n', '<br />')}
        </div>`,
      }
    })
  }

  errorList() {
    return this.errors.map(it => {
      return {
        text: it.text,
        html: it.html,
        href: it.fields.length ? `#${it.fields[0]}` : null,
      }
    })
  }
}

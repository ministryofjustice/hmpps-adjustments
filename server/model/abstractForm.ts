import dayjs from 'dayjs'
import { ValidationMessage } from '../@types/adjustments/adjustmentsTypes'
import { fieldHasErrors } from '../utils/utils'
import ValidationError from './validationError'

export default abstract class AbstractForm<T> {
  constructor(params: Partial<T>) {
    Object.assign(this, params)
  }

  errors: ValidationError[] = []

  validate(): void {
    this.errors = this.validation()
  }

  abstract validation(): ValidationError[]

  protected validateDate(day: string, month: string, year: string, fieldPrefix: string): ValidationError {
    if (!day && !month && !year) {
      return {
        message: 'The date entered must include a valid day, month and a year.',
        fields: [`${fieldPrefix}-day`, `${fieldPrefix}-month`, `${fieldPrefix}-year`],
      }
    }
    let message = 'The date entered must include a'
    const fields = []
    if (!day) {
      message += ' day'
      fields.push(`${fieldPrefix}-day`)
    }
    if (!month) {
      message += `${fields.length ? ' and' : ''} month`
      fields.push(`${fieldPrefix}-month`)
    }
    if (!year) {
      message += `${fields.length ? ' and' : ''} year`
      fields.push(`${fieldPrefix}-year`)
    }
    if (fields.length) {
      message += '.'
      return {
        message,
        fields,
      }
    }
    const date = dayjs(`${month}-${day}-${year}`) // DayJS will only validate date if entered in american format (month first.)
    if (!date.isValid()) {
      return {
        message: 'The date entered must include a valid day, month and a year.',
        fields: [`${fieldPrefix}-day`, `${fieldPrefix}-month`, `${fieldPrefix}-year`],
      }
    }
    return null
  }

  fieldHasError(field: string): boolean {
    return fieldHasErrors(this.errors, field)
  }

  messageForField(...fields: string[]): { text: string } {
    const error = this.errors.find(it => fields.find(field => it.fields.indexOf(field) !== -1))
    if (error) {
      return { text: error.message }
    }
    return null
  }

  addErrors(validationMessages: ValidationMessage[]) {
    this.errors = validationMessages.map(it => {
      return {
        fields: [],
        message: it.message,
      }
    })
  }

  errorList() {
    return this.errors.map(it => {
      return {
        text: it.message,
        href: it.fields.length ? `#${it.fields[0]}` : null,
      }
    })
  }
}

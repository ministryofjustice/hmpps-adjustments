import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class WarningForm extends AbstractForm {
  constructor(params: Partial<WarningForm>) {
    super()
    Object.assign(this, params)
  }

  confirm: 'yes' | 'no'

  async validation(): Promise<ValidationError[]> {
    if (this.confirm === null || this.confirm === undefined) {
      return [
        {
          fields: ['confirm'],
          text: 'Select an answer',
        },
      ]
    }
    return []
  }
}

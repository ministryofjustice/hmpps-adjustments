import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class ReviewRemandForm extends AbstractForm {
  constructor(params: Partial<ReviewRemandForm>) {
    super()
    Object.assign(this, params)
  }

  another: 'yes' | 'no'

  async validation(): Promise<ValidationError[]> {
    if (!this.another) {
      return [
        {
          fields: ['another'],
          text: 'Select an answer',
        },
      ]
    }
    return []
  }
}

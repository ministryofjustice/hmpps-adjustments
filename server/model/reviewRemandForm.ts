import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class ReviewRemandForm extends AbstractForm<ReviewRemandForm> {
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

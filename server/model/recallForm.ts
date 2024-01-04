import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class RecallForm extends AbstractForm<RecallForm> {
  adjustments: string | string[]

  async validation(): Promise<ValidationError[]> {
    if (!this.getSelectedAdjustments().length) {
      return [
        {
          fields: ['adjustments'],
          text: 'Select adjustments.',
        },
      ]
    }
    return []
  }

  public getSelectedAdjustments(): string[] {
    if (this.adjustments) {
      return [].concat(this.adjustments)
    }
    return []
  }
}

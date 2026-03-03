import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class ConfirmRejectPreviousPeriodsOfUalForm extends AbstractForm<ConfirmRejectPreviousPeriodsOfUalForm> {
  confirm: 'yes' | 'no'

  async validation(): Promise<ValidationError[]> {
    if (this.confirm === null || this.confirm === undefined) {
      return [
        {
          fields: ['confirm'],
          text: 'Select yes if you want to continue without applying UAL',
        },
      ]
    }
    return []
  }
}

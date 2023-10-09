import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class PadaForm extends AbstractForm<PadaForm> {
  prospective: string | string[]

  none: string

  async validation(): Promise<ValidationError[]> {
    if (!this.prospective?.length && !this.none) {
      return [
        {
          fields: [],
          text: "Select the PADAs that apply, or select 'None of these PADAs apply'.",
        },
      ]
    }
    return []
  }

  public getSelectedProspectiveAdas(): string[] {
    if (this.prospective) {
      return [].concat(this.prospective)
    }
    return []
  }
}

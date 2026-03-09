import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class PadaForm extends AbstractForm {
  constructor(params: Partial<PadaForm>) {
    super()
    Object.assign(this, params)
  }

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

import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import ValidationError from './validationError'

export default class RemandOffencesForm extends AbstractForm<RemandOffencesForm> {
  chargeId: string | string[]

  toAdjustment(adjustment: Adjustment): Adjustment {
    return { ...adjustment, remand: { chargeId: [].concat(this.chargeId).map(it => Number(it)) } }
  }

  async validation(): Promise<ValidationError[]> {
    const errors = []

    if (!this.chargeId || !this.chargeId.length)
      errors.push({
        text: 'Select an offence',
        fields: [],
      })

    return errors
  }

  static fromAdjustment(adjustment: Adjustment): RemandOffencesForm {
    return new RemandOffencesForm({
      chargeId: adjustment?.remand?.chargeId?.map(it => it.toString()) || [],
    })
  }
}

import SessionAdjustment from '../../@types/AdjustmentTypes'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { offencesForRemandAdjustment } from '../../utils/utils'
import AbstractForm from '../abstractForm'
import ValidationError from '../validationError'

export default class RemandOffencesForm extends AbstractForm<RemandOffencesForm> {
  chargeId: string | string[]

  toAdjustment(adjustment: Adjustment): SessionAdjustment {
    return { ...adjustment, remand: { chargeId: [].concat(this.chargeId).map(it => Number(it)) }, complete: true }
  }

  async validation(): Promise<ValidationError[]> {
    const errors = []

    if (!this.chargeId || !this.chargeId.length)
      errors.push({
        text: 'You must select the offence(s) which relate to the remand period.',
        fields: [],
      })

    return errors
  }

  isChecked(charge: number): boolean {
    return [].concat(this.chargeId).includes(charge.toString())
  }

  static fromAdjustment(
    adjustment: Adjustment,
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences[],
  ): RemandOffencesForm {
    return new RemandOffencesForm({
      chargeId: offencesForRemandAdjustment(adjustment, sentencesAndOffence).map(it => it.offenderChargeId.toString()),
    })
  }
}

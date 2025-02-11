import SessionAdjustment from '../../@types/AdjustmentTypes'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { offencesForTimeSpentInCustodyAbroadAdjustment } from '../../utils/utils'
import AbstractForm from '../abstractForm'
import ValidationError from '../validationError'

export default class TimeSpentInCustodyAbroadOffencesForm extends AbstractForm<TimeSpentInCustodyAbroadOffencesForm> {
  chargeId: string | string[]

  toAdjustment(adjustment: Adjustment): SessionAdjustment {
    return {
      ...adjustment,
      timeSpentInCustodyAbroad: {
        ...adjustment.timeSpentInCustodyAbroad,
        chargeIds: [].concat(this.chargeId).map(it => Number(it)),
      },
    }
  }

  async validation(): Promise<ValidationError[]> {
    const errors = []

    if (!this.chargeId || !this.chargeId.length)
      errors.push({
        text: 'You must select the offence(s) which relate to the time spent in custody abroad adjustment.',
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
  ): TimeSpentInCustodyAbroadOffencesForm {
    return new TimeSpentInCustodyAbroadOffencesForm({
      chargeId: offencesForTimeSpentInCustodyAbroadAdjustment(adjustment, sentencesAndOffence).map(it =>
        it.offenderChargeId.toString(),
      ),
    })
  }
}

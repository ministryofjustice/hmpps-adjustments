import SessionAdjustment from '../../@types/AdjustmentTypes'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { offencesForTimeSpentAsAnAppealApplicantAdjustment } from '../../utils/utils'
import AbstractForm from '../abstractForm'
import ValidationError from '../validationError'

export default class TimeSpentAsAnAppealApplicantOffencesForm extends AbstractForm<TimeSpentAsAnAppealApplicantOffencesForm> {
  chargeId: string | string[]

  toAdjustment(adjustment: Adjustment): SessionAdjustment {
    return {
      ...adjustment,
      timeSpentAsAnAppealApplicant: {
        ...adjustment.timeSpentAsAnAppealApplicant,
        chargeIds: [].concat(this.chargeId).map(it => Number(it)),
      },
    }
  }

  async validation(): Promise<ValidationError[]> {
    const errors = []

    if (!this.chargeId || !this.chargeId.length)
      errors.push({
        text: 'You must select the offence(s) which relate to the time spent as an appeal applicant not to count adjustment.',
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
  ): TimeSpentAsAnAppealApplicantOffencesForm {
    return new TimeSpentAsAnAppealApplicantOffencesForm({
      chargeId: offencesForTimeSpentAsAnAppealApplicantAdjustment(adjustment, sentencesAndOffence).map(it =>
        it.offenderChargeId.toString(),
      ),
    })
  }
}

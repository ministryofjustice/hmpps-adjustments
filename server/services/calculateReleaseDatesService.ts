import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween } from '../utils/utils'

export default class CalculateReleaseDatesService {
  async calculateUnusedDeductions(
    prisonerId: string,
    adjustments: Adjustment[],
    token: string,
  ): Promise<UnusedDeductionCalculationResponse> {
    return new CalculateReleaseDatesApiClient(token).calculateUnusedDeductions(prisonerId, adjustments)
  }

  async unusedDeductionsHandlingCRDError(
    sessionAdjustments: { string?: Adjustment },
    adjustments: Adjustment[],
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences[],
    nomsId: string,
    token: string,
  ): Promise<UnusedDeductionCalculationResponse> {
    try {
      return await this.calculateUnusedDeductions(
        nomsId,
        [...this.makeSessionAdjustmentsReadyForCalculation(sessionAdjustments, sentencesAndOffence), ...adjustments],
        token,
      )
    } catch {
      // If CRDS can't calculate unused deductions. There may be a validation error, or some NOMIS deductions.
      return null
    }
  }

  private makeSessionAdjustmentsReadyForCalculation(
    sessionAdjustments: { string?: Adjustment },
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences[],
  ): Adjustment[] {
    return Object.values(sessionAdjustments).map(it => {
      const sentence = sentencesAndOffence.find(sent =>
        sent.offences.some(off => it.remand.chargeId.includes(off.offenderChargeId)),
      )
      return {
        ...it,
        daysBetween: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
        effectiveDays: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
        sentenceSequence: sentence.sentenceSequence,
      }
    })
  }
}

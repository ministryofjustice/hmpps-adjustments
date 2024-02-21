import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween } from '../utils/utils'
import SessionAdjustment from '../@types/AdjustmentTypes'

const expectedUnusedDeductionsValidations = [
  'CUSTODIAL_PERIOD_EXTINGUISHED_TAGGED_BAIL',
  'CUSTODIAL_PERIOD_EXTINGUISHED_REMAND',
]
export default class CalculateReleaseDatesService {
  async calculateUnusedDeductions(
    prisonerId: string,
    adjustments: Adjustment[],
    token: string,
  ): Promise<UnusedDeductionCalculationResponse> {
    const result = await new CalculateReleaseDatesApiClient(token).calculateUnusedDeductions(prisonerId, adjustments)
    return {
      ...result,
      validationMessages: result.validationMessages.filter(
        it => !expectedUnusedDeductionsValidations.includes(it.code),
      ),
    }
  }

  async unusedDeductionsHandlingCRDError(
    sessionAdjustments: Record<string, SessionAdjustment>,
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
    } catch (error) {
      // If CRDS can't calculate unused deductions. There may be a validation error, or some NOMIS deductions.
      return null
    }
  }

  private makeSessionAdjustmentsReadyForCalculation(
    sessionAdjustments: Record<string, SessionAdjustment>,
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences[],
  ): Adjustment[] {
    return Object.values(sessionAdjustments).map(it => {
      let sentence
      if (it.adjustmentType === 'REMAND') {
        sentence = sentencesAndOffence.find(sent =>
          sent.offences.some(off => it.remand.chargeId.includes(off.offenderChargeId)),
        )
      } else {
        sentence = sentencesAndOffence.find(sent => it.taggedBail.caseSequence === sent.caseSequence)
      }
      const days = it.fromDate && it.toDate ? daysBetween(new Date(it.fromDate), new Date(it.toDate)) : it.days
      return {
        ...it,
        daysTotal: days,
        effectiveDays: days,
        sentenceSequence: sentence.sentenceSequence,
      }
    })
  }
}

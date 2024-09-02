import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import {
  daysBetween,
  getActiveSentencesByCaseSequence,
  offencesForRemandAdjustment,
  relevantSentenceForTaggedBailAdjustment,
} from '../utils/utils'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { HmppsAuthClient } from '../data'

const expectedUnusedDeductionsValidations = [
  'CUSTODIAL_PERIOD_EXTINGUISHED_TAGGED_BAIL',
  'CUSTODIAL_PERIOD_EXTINGUISHED_REMAND',
]
export default class CalculateReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async calculateUnusedDeductions(
    prisonerId: string,
    adjustments: Adjustment[],
    username: string,
  ): Promise<UnusedDeductionCalculationResponse> {
    const result = await new CalculateReleaseDatesApiClient(
      await this.getSystemClientToken(username),
    ).calculateUnusedDeductions(prisonerId, adjustments)
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
    username: string,
  ): Promise<UnusedDeductionCalculationResponse> {
    try {
      const adjustmentsReadyForCalculation = [
        ...this.makeSessionAdjustmentsReadyForCalculation(sessionAdjustments, sentencesAndOffence),
        ...adjustments,
      ]

      return await this.calculateUnusedDeductions(nomsId, adjustmentsReadyForCalculation, username)
    } catch {
      // If CRDS can't calculate unused deductions. There may be a validation error, or some NOMIS deductions.
      return null
    }
  }

  private makeSessionAdjustmentsReadyForCalculation(
    sessionAdjustments: Record<string, SessionAdjustment>,
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences[],
  ): Adjustment[] {
    return Object.values(sessionAdjustments).map(it => {
      if (it.adjustmentType === 'REMAND') {
        let chargeId
        if (!it.remand?.chargeId?.length) {
          chargeId = offencesForRemandAdjustment(it, sentencesAndOffence).map(off => off.offenderChargeId)
        } else {
          chargeId = it.remand.chargeId
        }

        const sentence = sentencesAndOffence.find(sent =>
          sent.offences.some(off => chargeId.includes(off.offenderChargeId)),
        )

        const days = it.fromDate && it.toDate ? daysBetween(new Date(it.fromDate), new Date(it.toDate)) : it.days
        return {
          ...it,
          remand: { chargeId },
          days,
          effectiveDays: days,
          sentenceSequence: sentence.sentenceSequence,
        }
      }

      let caseSequence
      if (!it.taggedBail?.caseSequence) {
        const sentencesByCaseSequence = getActiveSentencesByCaseSequence(sentencesAndOffence)
        const sentencesForCaseSequence = sentencesByCaseSequence.find(sent =>
          relevantSentenceForTaggedBailAdjustment(sent, it),
        )

        caseSequence = sentencesForCaseSequence.caseSequence
      } else {
        caseSequence = it.taggedBail.caseSequence
      }

      const sentence = sentencesAndOffence.find(sent => caseSequence === sent.caseSequence)

      const days = it.fromDate && it.toDate ? daysBetween(new Date(it.fromDate), new Date(it.toDate)) : it.days
      return {
        ...it,
        taggedBail: { caseSequence },
        days,
        effectiveDays: days,
        sentenceSequence: sentence.sentenceSequence,
      }
    })
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}

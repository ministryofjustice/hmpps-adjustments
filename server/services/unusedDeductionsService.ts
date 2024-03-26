import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { delay } from '../utils/utils'
import AdjustmentsService from './adjustmentsService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'

export type UnusedDeductionMessageType = 'NOMIS_ADJUSTMENT' | 'VALIDATION' | 'UNSUPPORTED' | 'UNKNOWN' | 'NONE'

export default class UnusedDeductionsService {
  private maxTries = 6 // 3 seconds max wait

  private waitBetweenTries = 500

  constructor(
    private readonly adjustmentsService: AdjustmentsService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {}

  private anyDeductionFromNomis(deductions: Adjustment[]) {
    return deductions.some(it => !it.remand?.chargeId?.length && !it.taggedBail?.caseSequence)
  }

  /* Wait until calclulated unused deductions matches with adjustments database. */
  async waitUntilUnusedRemandCreated(nomsId: string, token: string): Promise<UnusedDeductionMessageType> {
    try {
      let adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)

      const unusedDeductionsResponse = await this.calculateReleaseDatesService.calculateUnusedDeductions(
        nomsId,
        adjustments,
        token,
      )

      if (unusedDeductionsResponse.validationMessages?.length) {
        if (
          unusedDeductionsResponse.validationMessages.find(
            it => it.type === 'UNSUPPORTED_CALCULATION' || it.type === 'UNSUPPORTED_SENTENCE',
          )
        ) {
          return 'UNSUPPORTED'
        }

        return 'VALIDATION'
      }
      const calculatedUnusedDeducions = unusedDeductionsResponse.unusedDeductions

      const deductions = adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
      if (!deductions.length) {
        // If there are no deductions then unused deductions doesn't need to be calculated
        return 'NONE'
      }
      if (this.anyDeductionFromNomis(deductions)) {
        // won't calculate unused deductions if adjusments are not from DPS.
        return 'NOMIS_ADJUSTMENT'
      }

      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < this.maxTries; i += 1) {
        if (calculatedUnusedDeducions || calculatedUnusedDeducions === 0) {
          const dbDeductions = this.getTotalUnusedRemand(adjustments)
          if (calculatedUnusedDeducions === dbDeductions) {
            return 'NONE'
          }
          await delay(this.waitBetweenTries)
          adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)
          // Try again
        } else {
          // Unable to calculate unused deductions.
          return 'UNKNOWN'
        }
      }
    } catch {
      // Error couldn't calculate unused deductions.
    }

    return 'UNKNOWN'
    /* eslint-enable no-await-in-loop */
  }

  async getCalculatedUnusedDeductionsMessage(
    nomsId: string,
    adjustments: Adjustment[],
    token: string,
  ): Promise<UnusedDeductionMessageType> {
    try {
      const unusedDeductionsResponse = await this.calculateReleaseDatesService.calculateUnusedDeductions(
        nomsId,
        adjustments,
        token,
      )

      if (unusedDeductionsResponse.validationMessages?.length) {
        if (
          unusedDeductionsResponse.validationMessages.find(
            it => it.type === 'UNSUPPORTED_CALCULATION' || it.type === 'UNSUPPORTED_SENTENCE',
          )
        ) {
          return 'UNSUPPORTED'
        }

        return 'VALIDATION'
      }
      const calculatedUnusedDeducions = unusedDeductionsResponse.unusedDeductions

      const deductions = adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
      if (!deductions.length) {
        // If there are no deductions then unused deductions doesn't need to be calculated
        return 'NONE'
      }
      if (this.anyDeductionFromNomis(deductions)) {
        return 'NOMIS_ADJUSTMENT'
      }

      if (calculatedUnusedDeducions || calculatedUnusedDeducions === 0) {
        const dbDeductions = this.getTotalUnusedRemand(adjustments)
        if (calculatedUnusedDeducions === dbDeductions) {
          return 'NONE'
        }
      }

      return 'UNKNOWN'
    } catch {
      return 'UNKNOWN'
    }
  }

  private getTotalUnusedRemand(adjustments: Adjustment[]): number {
    return adjustments.find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')?.effectiveDays || 0
  }
}

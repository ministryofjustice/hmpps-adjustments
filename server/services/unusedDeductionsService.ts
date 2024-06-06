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

  async getCalculatedUnusedDeductionsMessageAndAdjustments(
    nomsId: string,
    startOfSentenceEnvelope: Date,
    retry: boolean,
    username: string,
  ): Promise<[UnusedDeductionMessageType, Adjustment[]]> {
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, startOfSentenceEnvelope, username)
    try {
      const deductions = adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
      if (!deductions.length) {
        // If there are no deductions then unused deductions doesn't need to be calculated
        return ['NONE', adjustments]
      }

      const unusedDeductionsResponse = await this.calculateReleaseDatesService.calculateUnusedDeductions(
        nomsId,
        adjustments,
        username,
      )

      if (unusedDeductionsResponse.validationMessages?.length) {
        if (
          unusedDeductionsResponse.validationMessages.find(
            it => it.type === 'UNSUPPORTED_CALCULATION' || it.type === 'UNSUPPORTED_SENTENCE',
          )
        ) {
          return ['UNSUPPORTED', adjustments]
        }

        return ['VALIDATION', adjustments]
      }

      if (this.anyDeductionFromNomis(deductions)) {
        return ['NOMIS_ADJUSTMENT', adjustments]
      }

      const calculatedUnusedDeducions = unusedDeductionsResponse.unusedDeductions
      if (calculatedUnusedDeducions || calculatedUnusedDeducions === 0) {
        const dbDeductions = this.getTotalUnusedRemand(adjustments)
        if (calculatedUnusedDeducions === dbDeductions) {
          return ['NONE', adjustments]
        }
        if (retry) {
          /* eslint-disable no-await-in-loop */
          for (let i = 0; i < this.maxTries; i += 1) {
            await delay(this.waitBetweenTries)
            const retryAdjustments = await this.adjustmentsService.findByPerson(
              nomsId,
              startOfSentenceEnvelope,
              username,
            )
            const retryDeductions = this.getTotalUnusedRemand(retryAdjustments)
            if (calculatedUnusedDeducions === retryDeductions) {
              return ['NONE', retryAdjustments]
            }
            // Try again
          }
          /* eslint-enable no-await-in-loop */
        }
      }

      return ['UNKNOWN', adjustments]
    } catch {
      return ['UNKNOWN', adjustments]
    }
  }

  private getTotalUnusedRemand(adjustments: Adjustment[]): number {
    return adjustments.find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')?.effectiveDays || 0
  }
}

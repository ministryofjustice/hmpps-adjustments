import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { delay } from '../utils/utils'
import AdjustmentsService from './adjustmentsService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'

export default class UnusedDeductionsService {
  private maxTries = 6 // 3 seconds max wait

  private waitBetweenTries = 500

  constructor(
    private readonly adjustmentsService: AdjustmentsService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {}

  /* Wait until calclulated unused deductions matches with adjustments database. */
  async waitUntilUnusedRemandCreated(nomsId: string, token: string): Promise<boolean> {
    try {
      let adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)

      const deductions = adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
      const dpsDeductions = deductions.filter(it => it.daysTotal)
      if (deductions.length !== dpsDeductions.length) {
        // won't calculate unused deductions if adjusments are not from DPS.
        return false
      }

      const unusedDeductionsResponse = await this.calculateReleaseDatesService.calculateUnusedDeductions(
        nomsId,
        adjustments,
        token,
      )

      if (unusedDeductionsResponse.validationMessages?.length) {
        return false
      }
      const calculatedUnusedDeducions = unusedDeductionsResponse.unusedDeductions

      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < this.maxTries; i += 1) {
        if (calculatedUnusedDeducions || calculatedUnusedDeducions === 0) {
          const dbDeductions = this.getTotalUnusedRemand(adjustments)
          if (calculatedUnusedDeducions === dbDeductions) {
            return true
          }
          await delay(this.waitBetweenTries)
          adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)
          // Try again
        } else {
          // Unable to calculate unused deductions.
          return false
        }
      }
    } catch {
      // Error couldn't calculate unused deductions.
    }
    return false
    /* eslint-enable no-await-in-loop */
  }

  async serviceHasCalculatedUnusedDeductions(
    nomsId: string,
    adjustments: Adjustment[],
    token: string,
  ): Promise<boolean> {
    try {
      const unusedDeductionsResponse = await this.calculateReleaseDatesService.calculateUnusedDeductions(
        nomsId,
        adjustments,
        token,
      )

      if (unusedDeductionsResponse.validationMessages?.length) {
        return false
      }
      const calculatedUnusedDeducions = unusedDeductionsResponse.unusedDeductions

      if (calculatedUnusedDeducions || calculatedUnusedDeducions === 0) {
        const dbDeductions = this.getTotalUnusedRemand(adjustments)
        if (calculatedUnusedDeducions === dbDeductions) {
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  private getTotalUnusedRemand(adjustments: Adjustment[]): number {
    return adjustments.find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')?.effectiveDays || 0
  }
}

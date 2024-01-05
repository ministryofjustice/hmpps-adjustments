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
  async waitUntilUnusedRemandCreated(nomsId: string, token: string): Promise<void> {
    let adjustments = await this.adjustmentsService.findByPerson(nomsId, token)

    const deductions = adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
    const dpsDeductions = deductions.filter(it => it.days || it.daysBetween)
    if (deductions.length !== dpsDeductions.length) {
      // won't calculate unused deductions if adjusments are not from DPS.
      return
    }

    const calculatedUnusedDeducions = (
      await this.calculateReleaseDatesService.calculateUnusedDeductions(nomsId, adjustments, token)
    ).unusedDeductions

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < this.maxTries; i += 1) {
      if (calculatedUnusedDeducions || calculatedUnusedDeducions === 0) {
        const dbDeductions = this.getTotalUnusedRemand(adjustments)
        if (calculatedUnusedDeducions === dbDeductions) {
          return
        }
        await delay(this.waitBetweenTries)
        adjustments = await this.adjustmentsService.findByPerson(nomsId, token)
        // Try again
      } else {
        // Unable to calculate unused deductions.
        return
      }
    }
    /* eslint-enable no-await-in-loop */
  }

  private getTotalUnusedRemand(adjustments: Adjustment[]): number {
    return adjustments.find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')?.effectiveDays || 0
  }
}

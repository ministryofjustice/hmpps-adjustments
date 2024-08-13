import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { delay } from '../utils/utils'
import AdjustmentsService from './adjustmentsService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import PrisonerService from './prisonerService'

export type UnusedDeductionMessageType =
  | 'NOMIS_ADJUSTMENT'
  | 'VALIDATION'
  | 'UNSUPPORTED'
  | 'RECALL'
  | 'UNKNOWN'
  | 'NONE'

export default class UnusedDeductionsService {
  private maxTries = 6 // 3 seconds max wait

  private waitBetweenTries = 500

  constructor(
    private readonly adjustmentsService: AdjustmentsService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
  ) {}

  private anyDeductionFromNomis(deductions: Adjustment[]) {
    return deductions.some(it => it.source === 'NOMIS')
  }

  async getCalculatedUnusedDeductionsMessage(
    nomsId: string,
    bookingId: string,
    retry: boolean,
    username: string,
  ): Promise<UnusedDeductionMessageType> {
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)

    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )
    try {
      const deductions = adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
      if (!deductions.length) {
        // If there are no deductions then unused deductions doesn't need to be calculated
        return 'NONE'
      }

      const unusedDeductionsResponse = await this.calculateReleaseDatesService.calculateUnusedDeductions(
        nomsId,
        adjustments,
        username,
      )

      if (
        unusedDeductionsResponse.validationMessages?.find(
          it => it.type === 'UNSUPPORTED_CALCULATION' || it.type === 'UNSUPPORTED_SENTENCE',
        )
      ) {
        return 'UNSUPPORTED'
      }

      const anyRecalls = startOfSentenceEnvelope.sentencesAndOffences.some(it =>
        PrisonerService.recallTypes.includes(it.sentenceCalculationType),
      )
      if (anyRecalls) {
        // Currently we don't support unused deductions calculation if there is an active recall sentence.
        return 'RECALL'
      }

      if (unusedDeductionsResponse.validationMessages?.length) {
        return 'VALIDATION'
      }

      if (this.anyDeductionFromNomis(deductions)) {
        return 'NOMIS_ADJUSTMENT'
      }

      const calculatedUnusedDeductions = unusedDeductionsResponse.unusedDeductions
      if (calculatedUnusedDeductions || calculatedUnusedDeductions === 0) {
        const dbDeductions = this.getTotalUnusedRemand(adjustments)
        if (calculatedUnusedDeductions === dbDeductions) {
          return 'NONE'
        }
        if (retry) {
          /* eslint-disable no-await-in-loop */
          for (let i = 0; i < this.maxTries; i += 1) {
            await delay(this.waitBetweenTries)
            const retryAdjustments = await this.adjustmentsService.findByPerson(
              nomsId,
              startOfSentenceEnvelope.earliestSentence,
              username,
            )
            const retryDeductions = this.getTotalUnusedRemand(retryAdjustments)
            if (calculatedUnusedDeductions === retryDeductions) {
              return 'NONE'
            }
            // Try again
          }
          /* eslint-enable no-await-in-loop */
        }
      }

      return 'UNKNOWN'
    } catch {
      return 'UNKNOWN'
    }
  }

  async getCalculatedUnusedDeductionsMessageAndAdjustments(
    nomsId: string,
    bookingId: string,
    retry: boolean,
    username: string,
  ): Promise<[UnusedDeductionMessageType, Adjustment[]]> {
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)

    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )
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

      if (
        unusedDeductionsResponse.validationMessages?.find(
          it => it.type === 'UNSUPPORTED_CALCULATION' || it.type === 'UNSUPPORTED_SENTENCE',
        )
      ) {
        return ['UNSUPPORTED', adjustments]
      }

      const anyRecalls = startOfSentenceEnvelope.sentencesAndOffences.some(it =>
        PrisonerService.recallTypes.includes(it.sentenceCalculationType),
      )
      if (anyRecalls) {
        // Currently we don't support unused deductions calculation if there is an active recall sentence.
        return ['RECALL', adjustments]
      }

      if (unusedDeductionsResponse.validationMessages?.length) {
        return ['VALIDATION', adjustments]
      }

      if (this.anyDeductionFromNomis(deductions)) {
        return ['NOMIS_ADJUSTMENT', adjustments]
      }

      const calculatedUnusedDeductions = unusedDeductionsResponse.unusedDeductions
      if (calculatedUnusedDeductions || calculatedUnusedDeductions === 0) {
        const dbDeductions = this.getTotalUnusedRemand(adjustments)
        if (calculatedUnusedDeductions === dbDeductions) {
          return ['NONE', adjustments]
        }
        if (retry) {
          /* eslint-disable no-await-in-loop */
          for (let i = 0; i < this.maxTries; i += 1) {
            await delay(this.waitBetweenTries)
            const retryAdjustments = await this.adjustmentsService.findByPerson(
              nomsId,
              startOfSentenceEnvelope.earliestSentence,
              username,
            )
            const retryDeductions = this.getTotalUnusedRemand(retryAdjustments)
            if (calculatedUnusedDeductions === retryDeductions) {
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

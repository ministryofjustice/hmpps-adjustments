import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { delay } from '../utils/utils'
import AdjustmentsService from './adjustmentsService'
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
    private readonly prisonerService: PrisonerService,
  ) {}

  async getCalculatedUnusedDeductionsMessageAndAdjustments(
    nomsId: string,
    bookingId: string,
    username: string,
  ): Promise<[UnusedDeductionMessageType, Adjustment[]]> {
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)

    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )

    const deductions = adjustments.filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
    if (!deductions.length) {
      // If there are no deductions then unused deductions doesn't need to be calculated
      return ['NONE', adjustments]
    }

    const lookup = await this.adjustmentsService.getUnusedDeductionsCalculationResult(nomsId, username)
    if (lookup.status !== 'UNKNOWN') {
      if (lookup.status === 'IN_PROGRESS') {
        return this.waitForCalculationToFinish(nomsId, startOfSentenceEnvelope.earliestSentence, username)
      }
      const status = lookup.status === 'CALCULATED' ? 'NONE' : lookup.status
      return [status, adjustments]
    }
    return ['NOMIS_ADJUSTMENT', adjustments]
  }

  private async waitForCalculationToFinish(
    nomsId: string,
    startOfSentenceEnvelope: Date,
    username: string,
  ): Promise<[UnusedDeductionMessageType, Adjustment[]]> {
    let adjustments: Adjustment[]
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < this.maxTries; i += 1) {
      await delay(this.waitBetweenTries)
      const lookup = await this.adjustmentsService.getUnusedDeductionsCalculationResult(nomsId, username)
      if (lookup.status !== 'IN_PROGRESS') {
        const status = lookup.status === 'CALCULATED' ? 'NONE' : lookup.status
        adjustments = await this.adjustmentsService.findByPerson(nomsId, startOfSentenceEnvelope, username)
        return [status, adjustments]
      }
    }
    /* eslint-enable no-await-in-loop */
    return ['NOMIS_ADJUSTMENT', adjustments]
  }
}

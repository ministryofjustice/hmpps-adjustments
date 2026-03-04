import AbstractForm from './abstractForm'
import ValidationError from './validationError'
import { PreviousUnlawfullyAtLargeReviewRequest } from '../@types/adjustments/adjustmentsTypes'
import { safeArray } from '../utils/utils'

const NOTHING_SELECTED_ERROR = 'Select the UAL that applies to the release date calculation'
const BOTH_NONE_AND_A_PERIOD_SELECTED_ERROR =
  'Select the UAL that applies to the release date calculation or select ‘No previous periods of UAL apply’'

export default class ReviewPreviousUalForm extends AbstractForm<ReviewPreviousUalForm> {
  constructor(params: Partial<ReviewPreviousUalForm>) {
    super({
      selectedUalPeriod: safeArray(params.selectedUalPeriod),
      reviewedUalPeriod: safeArray(params.reviewedUalPeriod),
    })
  }

  selectedUalPeriod: string[]

  reviewedUalPeriod: string[]

  async validation(): Promise<ValidationError[]> {
    if (!this.selectedUalPeriod?.length) {
      return [
        {
          fields: ['selectedUalPeriod'],
          text: NOTHING_SELECTED_ERROR,
        },
      ]
    }

    if (this.isNoneSelected() && this.selectedUalPeriod.length > 1) {
      return [
        {
          fields: ['selectedUalPeriod'],
          text: BOTH_NONE_AND_A_PERIOD_SELECTED_ERROR,
        },
      ]
    }

    return []
  }

  isNoneSelected(): boolean {
    return this.selectedUalPeriod.find(it => it === 'none') !== undefined
  }

  toRequest(): PreviousUnlawfullyAtLargeReviewRequest {
    const acceptedAdjustmentIds = this.selectedUalPeriod.filter(it => it !== 'none') ?? []
    const rejectedAdjustmentIds = this.reviewedUalPeriod.filter(it => !acceptedAdjustmentIds.includes(it))
    return {
      acceptedAdjustmentIds,
      rejectedAdjustmentIds,
    }
  }
}

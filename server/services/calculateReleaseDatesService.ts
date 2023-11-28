import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'

export default class CalculateReleaseDatesService {
  async calculateUnusedDeductions(
    prisonerId: string,
    adjustments: Adjustment[],
    token: string,
  ): Promise<UnusedDeductionCalculationResponse> {
    return new CalculateReleaseDatesApiClient(token).calculateUnusedDeductions(prisonerId, adjustments)
  }
}

import AdjudicationClient from '../api/adjudicationsClient'
import { AdjudicationSearchResponse } from '../@types/adjudications/adjudicationTypes'

export default class AdditionalDaysAwardedService {
  public async getAdjudications(nomsId: string, token: string): Promise<AdjudicationSearchResponse> {
    return new AdjudicationClient(token).getAdjudications(nomsId)
  }
}

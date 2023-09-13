import AdjudicationClient from '../api/adjudicationsClient'
import { AdjudicationSearchResponse } from '../@types/adjudications/adjudicationTypes'
import { HmppsAuthClient } from '../data'

export default class AdditionalDaysAwardedService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async getAdjudications(nomsId: string, username: string): Promise<AdjudicationSearchResponse> {
    const systemToken = await this.hmppsAuthClient.getSystemClientToken(username)
    return new AdjudicationClient(systemToken).getAdjudications(nomsId)
  }
}

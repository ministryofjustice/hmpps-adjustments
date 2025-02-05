import CourtCasesReleaseDatesApiClient from '../api/courtCasesReleaseDatesApiClient'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import { HmppsAuthClient } from '../data'

export default class CourtCasesReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async getServiceDefinitions(prisonerId: string, token: string): Promise<CcrdServiceDefinitions> {
    return new CourtCasesReleaseDatesApiClient(token).getServiceDefinitions(prisonerId)
  }

  public async evictCache(prisonerId: string, username: string): Promise<void> {
    return new CourtCasesReleaseDatesApiClient(await this.getSystemClientToken(username)).evictCache(prisonerId)
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}

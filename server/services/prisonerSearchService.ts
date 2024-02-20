import { Prisoner } from '../@types/prisonSearchApi/types'
import PrisonerSearchApiClient from '../api/prisonerSearchApiClient'
import { HmppsAuthClient } from '../data'

export default class PrisonerSearchService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getByPrisonerNumber(username: string, prisonerNumber: string): Promise<Prisoner> {
    return new PrisonerSearchApiClient(await this.getSystemClientToken(username)).getByPrisonerNumber(prisonerNumber)
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}

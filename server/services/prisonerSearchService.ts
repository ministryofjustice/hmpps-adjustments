import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'
import PrisonerSearchApiClient from '../api/prisonerSearchApiClient'
import { HmppsAuthClient } from '../data'
import FullPageError from '../model/FullPageError'
import { UserDetails } from './userService'

export default class PrisonerSearchService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getPrisonerDetails(nomsId: string, user: UserDetails): Promise<PrisonerSearchApiPrisoner> {
    try {
      const prisonerDetails = await new PrisonerSearchApiClient(
        await this.getSystemClientToken(user.username),
      ).getPrisonerDetails(nomsId)
      if (this.isAccessiblePrisoner(prisonerDetails.prisonId, user)) {
        return prisonerDetails
      }
      throw FullPageError.notInCaseLoadError()
    } catch (error) {
      if (error?.status === 404) {
        throw FullPageError.notInCaseLoadError()
      } else {
        throw error
      }
    }
  }

  private isAccessiblePrisoner(agencyId: string, user: UserDetails): boolean {
    return user.caseloads.includes(agencyId) || ['TRN'].includes(agencyId) || this.isReleasedAccessible(agencyId, user)
  }

  private isReleasedAccessible(agencyId: string, user: UserDetails): boolean {
    return user.hasInactiveBookingsAccess && ['OUT'].includes(agencyId)
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}

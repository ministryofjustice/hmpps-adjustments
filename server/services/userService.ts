import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import type { User } from '../data/manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import PrisonerService from './prisonerService'

export interface UserDetails extends User {
  displayName: string
  roles: string[]
  caseloads: string[]
  caseloadDescriptions: string[]
  caseloadMap: Map<string, string>
  isSupportUser: boolean
}

export default class UserService {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly prisonerService: PrisonerService,
  ) {}

  async getUser(userToken: string): Promise<UserDetails> {
    const user = await this.manageUsersApiClient.getUser(userToken)
    const userCaseloads = await this.prisonerService.getUsersCaseloads(userToken)
    const roles = this.getUserRoles(userToken)
    return {
      ...user,
      roles,
      ...(user.name && { displayName: convertToTitleCase(user.name) }),
      caseloads: userCaseloads.map(uc => uc.caseLoadId),
      caseloadDescriptions: userCaseloads.map(uc => uc.description),
      caseloadMap: new Map(userCaseloads.map(uc => [uc.caseLoadId, uc.description])),
      isSupportUser: roles.includes('COURTCASE_RELEASEDATE_SUPPORT'),
    }
  }

  getUserRoles(userToken: string): string[] {
    const { authorities: roles = [] } = jwtDecode(userToken) as { authorities?: string[] }
    return roles.map(role => role.substring(role.indexOf('_') + 1))
  }
}

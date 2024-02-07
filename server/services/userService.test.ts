import nock from 'nock'
import UserService from './userService'
import HmppsAuthClient, { User } from '../data/hmppsAuthClient'
import config from '../config'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/prisonClientTypes'

jest.mock('../data/hmppsAuthClient')

// Token generated from https://jwt.io/
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJhdXRob3JpdGllcyI6WyJST0xFX1JFTUFORF9JREVOVElGSUVSIl19.NGFqJz3OSXNPh3qsofGdUgDn-IxcEtgq65kn1u41WMM'

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let userService: UserService

  let fakeApi: nock.Scope
  describe('getUser', () => {
    const caseload = {
      caseLoadId: 'MDI',
    } as PrisonApiUserCaseloads

    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
      userService = new UserService(hmppsAuthClient)
      config.apis.prisonApi.url = 'http://localhost:8100'
      fakeApi = nock(config.apis.prisonApi.url)
    })
    it('Retrieves and formats user name', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'anon nobody' } as User)
      fakeApi.get(`/api/users/me/caseLoads`).reply(200, [caseload])

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('Anon Nobody')
      expect(result.caseloads).toEqual(['MDI'])
      expect(result.roles).toEqual(['REMAND_IDENTIFIER'])
    })
    it('Propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})

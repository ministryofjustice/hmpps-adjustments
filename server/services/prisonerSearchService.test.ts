import nock from 'nock'
import HmppsAuthClient from '../data/hmppsAuthClient'
import config from '../config'
import PrisonerSearchService from './prisonerSearchService'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'
import FullPageErrorType from '../model/FullPageErrorType'
import { UserDetails } from './userService'

jest.mock('../data/hmppsAuthClient')

const prisonerDetails = {
  prisonerNumber: 'A1234AB',
  firstName: 'Anon',
  lastName: 'Nobody',
  prisonId: 'MDI',
} as PrisonerSearchApiPrisoner

const username = 'some-user'

const user = {
  username,
  caseloads: ['MDI'],
} as UserDetails

describe('Prisoner search service related tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonerSearchService: PrisonerSearchService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.prisonerSearchApi.url = 'http://localhost:8110'
    fakeApi = nock(config.apis.prisonerSearchApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    hmppsAuthClient.getSystemClientToken.mockResolvedValue('token')
    prisonerSearchService = new PrisonerSearchService(hmppsAuthClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('Test getting prisoner details', async () => {
    fakeApi.get(`/prisoner/A1234AB`).reply(200, prisonerDetails)

    const result = await prisonerSearchService.getPrisonerDetails('A1234AB', user)

    expect(result).toEqual(prisonerDetails)
  })

  it('Test getting prisoner details when caseload is different', async () => {
    fakeApi.get(`/prisoner/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'LEX' })

    try {
      await prisonerSearchService.getPrisonerDetails('A1234AB', user)
    } catch (error) {
      expect(error.errorKey).toBe(FullPageErrorType.NOT_IN_CASELOAD)
      expect(error.status).toBe(404)
    }
  })

  it('Test getting released prisoner details when user has inactive booking role', async () => {
    fakeApi.get(`/prisoner/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'OUT' })

    const result = await prisonerSearchService.getPrisonerDetails('A1234AB', {
      ...user,
      hasInactiveBookingsAccess: true,
    })

    expect(result.prisonerNumber).toEqual(prisonerDetails.prisonerNumber)
  })

  it('Test getting released prisoner details when user does not have inactive booking role', async () => {
    fakeApi.get(`/prisoner/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'OUT' })

    try {
      await prisonerSearchService.getPrisonerDetails('A1234AB', { ...user, hasInactiveBookingsAccess: false })
    } catch (error) {
      expect(error.errorKey).toBe(FullPageErrorType.NOT_IN_CASELOAD)
      expect(error.status).toBe(404)
    }
  })

  it('Test getting transferred prisoner details', async () => {
    fakeApi.get(`/prisoner/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'TRN' })

    const result = await prisonerSearchService.getPrisonerDetails('A1234AB', user)

    expect(result.prisonerNumber).toEqual(prisonerDetails.prisonerNumber)
  })
})

import nock from 'nock'
import HmppsAuthClient from '../data/hmppsAuthClient'
import config from '../config'
import PrisonerService from './prisonerService'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import FullPageErrorType from '../model/FullPageErrorType'

jest.mock('../data/hmppsAuthClient')

const prisonerDetails = {
  offenderNo: 'A1234AA',
  firstName: 'Anon',
  lastName: 'Nobody',
  latestLocationId: 'LEI',
  locationDescription: 'Inside - Leeds HMP',
  dateOfBirth: '24/06/2000',
  age: 21,
  activeFlag: true,
  legalStatus: 'REMAND',
  category: 'Cat C',
  imprisonmentStatus: 'LIFE',
  imprisonmentStatusDescription: 'Serving Life Imprisonment',
  religion: 'Christian',
  agencyId: 'MDI',
} as PrisonApiPrisoner

const token = 'token'

describe('Prisoner service related tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonerService: PrisonerService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    prisonerService = new PrisonerService(hmppsAuthClient)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('prisonerService', () => {
    describe('getPrisonerDetail', () => {
      it('Test getting prisoner details', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, prisonerDetails)

        const result = await prisonerService.getPrisonerDetail('A1234AB', ['MDI'], token)

        expect(result).toEqual(prisonerDetails)
      })

      it('Test getting prisoner details when caseload is different', async () => {
        fakeApi.get(`/api/offenders/A1234AB`).reply(200, { ...prisonerDetails, agencyId: 'LEX' })

        try {
          await prisonerService.getPrisonerDetail('A1234AB', ['MDI'], token)
        } catch (error) {
          expect(error.errorKey).toBe(FullPageErrorType.NOT_IN_CASELOAD)
          expect(error.status).toBe(404)
        }
      })

      it('Test getting start of sentence envelope', async () => {
        fakeApi.get(`/api/offender-sentences/booking/9991/sentences-and-offences`).reply(200, [
          { sentenceDate: '2023-04-01', sentenceStatus: 'A' } as PrisonApiOffenderSentenceAndOffences,
          { sentenceDate: '2023-02-01', sentenceStatus: 'A' } as PrisonApiOffenderSentenceAndOffences,
          { sentenceDate: '2023-03-01', sentenceStatus: 'A' } as PrisonApiOffenderSentenceAndOffences,
          {
            sentenceDate: '2023-01-01',
            sentenceStatus: 'A',
            sentenceCalculationType: 'LR',
          } as PrisonApiOffenderSentenceAndOffences,
        ])

        const result = await prisonerService.getStartOfSentenceEnvelope('9991', token)

        expect(result.earliestExcludingRecalls.toISOString().substring(0, 10)).toBe('2023-02-01')
        expect(result.earliestSentence.toISOString().substring(0, 10)).toBe('2023-01-01')
      })
    })
  })
})

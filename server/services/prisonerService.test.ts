import nock from 'nock'
import config from '../config'
import PrisonerService from './prisonerService'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import HmppsAuthClient from '../data/hmppsAuthClient'
import RemandAndSentencingService from './remandAndSentencingService'

jest.mock('../data/hmppsAuthClient')

describe('Prisoner service related tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let prisonerService: PrisonerService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.prisonApi.url)
    remandAndSentencingService = {
      isSentenceRecalled: jest.fn(),
    } as unknown as jest.Mocked<RemandAndSentencingService>
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    hmppsAuthClient.getSystemClientToken.mockResolvedValue('token')
    prisonerService = new PrisonerService(hmppsAuthClient, remandAndSentencingService)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('prisonerService', () => {
    describe('getPrisonerDetail', () => {
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
        remandAndSentencingService.isSentenceRecalled.mockImplementation(sentenceType => {
          return sentenceType === 'LR'
        })
        const result = await prisonerService.getStartOfSentenceEnvelope('9991', 'username')

        expect(result.earliestExcludingRecalls.toISOString().substring(0, 10)).toBe('2023-02-01')
        expect(result.earliestSentence.toISOString().substring(0, 10)).toBe('2023-01-01')
      })
    })
  })
})

import nock from 'nock'
import config from '../config'
import RemandAndSentencingService from './remandAndSentencingService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { SentenceTypesAndItsDetails } from '../@types/remandAndSentencingApi/remandAndSentencingApiTypes'

jest.mock('../data/hmppsAuthClient')

describe('Remand And Sentencing service related tests', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let remandAndSentencingService: RemandAndSentencingService
  let fakeApi: nock.Scope
  beforeEach(() => {
    config.apis.remandAndSentencingApi.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.remandAndSentencingApi.url)
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    hmppsAuthClient.getSystemClientToken.mockResolvedValue('token')
    remandAndSentencingService = new RemandAndSentencingService(hmppsAuthClient)
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('RemandAndSentencingService', () => {
    describe('getSentenceTypesAndItsDetails', () => {
      it('should fetch and cache the sentence types and details', async () => {
        const response: SentenceTypesAndItsDetails = [
          {
            nomisSentenceTypeReference: 'ADIMP_ORA',
            recall: {
              isRecall: false,
              type: 'NONE',
              isFixedTermRecall: false,
              lengthInDays: 0,
            },
            nomisDescription: 'CJA03 Standard Determinate Sentence',
            isIndeterminate: false,
            nomisActive: true,
            nomisExpiryDate: null,
          },
        ]
        fakeApi.get(`/legacy/sentence-type/all/summary`).reply(200, response)

        // First call - fetches from API and caches the result
        const result = await remandAndSentencingService.getSentenceTypeAndItsDetails('username')
        expect(result).toStrictEqual(response)

        // Second call - should return cached data
        const cachedResult = await remandAndSentencingService.getSentenceTypeAndItsDetails('username')
        expect(cachedResult).toStrictEqual(response)

        // Ensure the API was only called once
        expect(fakeApi.isDone()).toBe(true)
      })

      it('should fetch new data after cache expiry', async () => {
        const initialResponse: SentenceTypesAndItsDetails = [
          {
            nomisSentenceTypeReference: 'ADIMP_ORA',
            recall: {
              isRecall: false,
              type: 'NONE',
              isFixedTermRecall: false,
              lengthInDays: 0,
            },
            nomisDescription: 'CJA03 Standard Determinate Sentence',
            isIndeterminate: false,
            nomisActive: true,
            nomisExpiryDate: null,
          },
        ]
        const newResponse: SentenceTypesAndItsDetails = [
          {
            nomisSentenceTypeReference: 'NEW_TYPE',
            recall: {
              isRecall: true,
              type: 'FIXED',
              isFixedTermRecall: true,
              lengthInDays: 30,
            },
            nomisDescription: 'New Sentence Type',
            isIndeterminate: false,
            nomisActive: true,
            nomisExpiryDate: null,
          },
        ]

        fakeApi.get(`/legacy/sentence-type/all/summary`).reply(200, initialResponse)

        // First call - fetches from API and caches the result
        const result = await remandAndSentencingService.getSentenceTypeAndItsDetails('username')
        expect(result).toStrictEqual(initialResponse)

        // Simulate cache expiry by manually setting the cache expiry to a past time
        remandAndSentencingService.cache.expiry = Date.now() - 1000

        // Mock the API to return new data
        fakeApi.get(`/legacy/sentence-type/all/summary`).reply(200, newResponse)

        // Second call - fetches new data from API
        const newResult = await remandAndSentencingService.getSentenceTypeAndItsDetails('username')
        expect(newResult).toStrictEqual(newResponse)

        // Ensure the API was called twice (once for each response)
        expect(fakeApi.isDone()).toBe(true)
      })

      it('Test getting all the sentence types and its details', async () => {
        const response: SentenceTypesAndItsDetails = [
          {
            nomisSentenceTypeReference: 'ADIMP_ORA',
            recall: {
              isRecall: false,
              type: 'NONE',
              isFixedTermRecall: false,
              lengthInDays: 0,
            },
            nomisDescription: 'CJA03 Standard Determinate Sentence',
            isIndeterminate: false,
            nomisActive: true,
            nomisExpiryDate: null,
          },
        ]
        fakeApi.get(`/legacy/sentence-type/all/summary`).reply(200, response)

        const result = await remandAndSentencingService.getSentenceTypeAndItsDetails('username')

        expect(result).toStrictEqual(response)
      })
    })
  })
})

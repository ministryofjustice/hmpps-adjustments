import nock from 'nock'
import config from '../config'
import RemandAndSentencingApi from './remandAndSentencingApiClient'
import { SentenceTypesAndItsDetails } from '../@types/remandAndSentencingApi/remandAndSentencingApiTypes'

jest.mock('../data/tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('getSentenceTypesAndItsDetails', () => {
  let fakeRemandAndSentencingApiClient: nock.Scope
  let remandAndSentencingApi: RemandAndSentencingApi

  beforeEach(() => {
    fakeRemandAndSentencingApiClient = nock(config.apis.remandAndSentencingApi.url)
    remandAndSentencingApi = new RemandAndSentencingApi(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getSentenceTypesAndItsDetails', () => {
    it('should return data from api', async () => {
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

      fakeRemandAndSentencingApiClient
        .get('/legacy/sentence-type/all/summary')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await remandAndSentencingApi.getSentenceTypesAndItsDetails()
      expect(output).toEqual(response)
    })
  })
})

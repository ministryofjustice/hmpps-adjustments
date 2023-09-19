import nock from 'nock'
import HmppsAuthClient from '../data/hmppsAuthClient'
import AdditionalDaysAwardedService from './additionalDaysAwardedService'
import TokenStore from '../data/tokenStore'
import config from '../config'
import { AdjudicationSearchResponse, IndividualAdjudication } from '../@types/adjudications/adjudicationTypes'
import { AdasToReview } from '../@types/AdaTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

jest.mock('../data/hmppsAuthClient')

const hmppsAuthClient = new HmppsAuthClient({} as TokenStore) as jest.Mocked<HmppsAuthClient>
const adaService = new AdditionalDaysAwardedService(hmppsAuthClient)

const token = 'token'

const adjudication1SearchResponse =
  '         {' +
  '           "adjudicationNumber":1525916,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
  '           "adjudicationCharges":' +
  '             [' +
  '                {"oicChargeId":"1525916/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
  '             ]' +
  '         }'
const adjudication2SearchResponse =
  '         {' +
  `             "adjudicationNumber":1525917,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,` +
  `             "adjudicationCharges":` +
  `               [` +
  `                  {"oicChargeId":"1525917/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}` +
  `               ]` +
  `           }`
const adjudication3SearchResponse =
  '         {' +
  `             "adjudicationNumber":1525918,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,` +
  `             "adjudicationCharges":` +
  `               [` +
  `                  {"oicChargeId":"1525917/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}` +
  `               ]` +
  `           }`
const threeAdjudicationSearchResponse = JSON.parse(
  `{"results":` +
    `     {"content":` +
    `       [${adjudication1SearchResponse}, ${adjudication2SearchResponse}, ${adjudication3SearchResponse}]` +
    `     }` +
    `  }`,
) as AdjudicationSearchResponse

const oneAdjudicationSearchResponse = JSON.parse(
  `{"results": {"content": [${adjudication1SearchResponse}] } }`,
) as AdjudicationSearchResponse

const twoAdjudicationsSearchResponse = JSON.parse(
  `{"results": {"content": [${adjudication1SearchResponse}, ${adjudication2SearchResponse}] } }`,
) as AdjudicationSearchResponse

const threeAdjudicationsSearchResponse = JSON.parse(
  `{"results": {"content": [${adjudication1SearchResponse}, ${adjudication2SearchResponse}, ${adjudication3SearchResponse}] } }`,
) as AdjudicationSearchResponse

const adjudicationOne = JSON.parse(
  '{"adjudicationNumber":1525916,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationTwo = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeWithTwoSanctions = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-04T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":17}, {"sanctionType":"Additional Days Added","sanctionDays":99,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":18}]}]}]}',
) as IndividualAdjudication

const adjudicationTwoConsecutiveToOne = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16, "consecutiveSanctionSeq": 15}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeConcurrentToOne = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":17}]}]}]}',
) as IndividualAdjudication

const adjudicationTwoConsecToNonAda = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16, "consecutiveSanctionSeq": 17}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeNonAda = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"non-ADA","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":17}]}]}]}',
) as IndividualAdjudication

const adjudicationOneAdjustment = {
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: 1525916 },
} as Adjustment
const adjudicationTwoAdjustment = {
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: 1525917 },
} as Adjustment
const adjudicationThreeAdjustment = {
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: 1525918 },
} as Adjustment

const adjustmentResponsesWithChargeNumber = [
  adjudicationOneAdjustment,
  adjudicationTwoAdjustment,
  adjudicationThreeAdjustment,
]

describe('Additional Days Added Service', () => {
  let adjudicationsApi: nock.Scope
  let adjustmentApi: nock.Scope

  beforeEach(() => {
    config.apis.adjudications.url = 'http://localhost:8100'
    adjudicationsApi = nock(config.apis.adjudications.url)
    config.apis.adjustments.url = 'http://localhost:8101'
    adjustmentApi = nock(config.apis.adjustments.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })
  describe('ADA Review screen', () => {
    it('Get concurrent adjudications ', async () => {
      const nomsId = 'AA1234A'
      adjudicationsApi
        .get('/adjudications/AA1234A/adjudications?size=1000', '')
        .reply(200, threeAdjudicationSearchResponse)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525916', '').reply(200, adjudicationOne)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525917', '').reply(200, adjudicationTwo)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525918', '').reply(200, adjudicationThreeWithTwoSanctions)
      adjustmentApi.get(`/adjustments?person=${nomsId}`).reply(200, adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')

      const adaToReview: AdasToReview = await adaService.getAdasToReview(
        nomsId,
        startOfSentenceEnvelope,
        'username',
        token,
      )

      expect(adaToReview).toEqual({
        adas: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Concurrent',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Concurrent',
                sequence: 16,
              },
            ],
          },
          {
            dateChargeProved: new Date('2023-08-04'),
            charges: [
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-04'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Concurrent',
                sequence: 17,
              },
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-04'),
                days: 99,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Concurrent',
                sequence: 18,
              },
            ],
          },
        ],
        suspended: [],
        awaitingApproval: [],
        totalAdas: 114,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
      } as AdasToReview)
    })

    it('Get adjudication where only one charge exists', async () => {
      const nomsId = 'AA1234A'
      adjudicationsApi
        .get('/adjudications/AA1234A/adjudications?size=1000', '')
        .reply(200, oneAdjudicationSearchResponse)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525916', '').reply(200, adjudicationOne)
      adjustmentApi.get(`/adjustments?person=${nomsId}`).reply(200, adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')

      const adaToReview: AdasToReview = await adaService.getAdasToReview(
        nomsId,
        startOfSentenceEnvelope,
        'username',
        token,
      )

      expect(adaToReview).toEqual({
        adas: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
            ],
          },
        ],
        suspended: [],
        awaitingApproval: [],
        totalAdas: 5,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
      } as AdasToReview)
    })

    it('Get adjudication where consecutive charges exist', async () => {
      const nomsId = 'AA1234A'
      adjudicationsApi
        .get('/adjudications/AA1234A/adjudications?size=1000', '')
        .reply(200, twoAdjudicationsSearchResponse)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525916', '').reply(200, adjudicationOne)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      adjustmentApi.get(`/adjustments?person=${nomsId}`).reply(200, adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')

      const adaToReview: AdasToReview = await adaService.getAdasToReview(
        nomsId,
        startOfSentenceEnvelope,
        'username',
        token,
      )

      expect(adaToReview).toEqual({
        adas: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Consecutive to 1525916',
                sequence: 16,
                consecutiveToSequence: 15,
              },
            ],
          },
        ],
        suspended: [],
        awaitingApproval: [],
        totalAdas: 10,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
      } as AdasToReview)
    })

    it('Get adjudication where a mix of consecutive and concurrent charges exist', async () => {
      const nomsId = 'AA1234A'
      adjudicationsApi
        .get('/adjudications/AA1234A/adjudications?size=1000', '')
        .reply(200, threeAdjudicationsSearchResponse)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525916', '').reply(200, adjudicationOne)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525918', '').reply(200, adjudicationThreeConcurrentToOne)
      adjustmentApi.get(`/adjustments?person=${nomsId}`).reply(200, adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')

      const adaToReview: AdasToReview = await adaService.getAdasToReview(
        nomsId,
        startOfSentenceEnvelope,
        'username',
        token,
      )

      expect(adaToReview).toEqual({
        adas: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Consecutive to 1525916',
                sequence: 16,
                consecutiveToSequence: 15,
              },
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Concurrent',
                sequence: 17,
              },
            ],
          },
        ],
        suspended: [],
        awaitingApproval: [],
        totalAdas: 15,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
      } as AdasToReview)
    })

    it('Get adjudication where ada is consecutive to a non-ada - edge case, this  really stems from bad data in nomis ', async () => {
      const nomsId = 'AA1234A'
      adjudicationsApi
        .get('/adjudications/AA1234A/adjudications?size=1000', '')
        .reply(200, threeAdjudicationsSearchResponse)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525916', '').reply(200, adjudicationOne)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525917', '').reply(200, adjudicationTwoConsecToNonAda)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525918', '').reply(200, adjudicationThreeNonAda)
      adjustmentApi.get(`/adjustments?person=${nomsId}`).reply(200, adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')

      const adaToReview: AdasToReview = await adaService.getAdasToReview(
        nomsId,
        startOfSentenceEnvelope,
        'username',
        token,
      )

      expect(adaToReview).toEqual({
        adas: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Concurrent',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'Concurrent',
                sequence: 16,
                consecutiveToSequence: 17,
              },
            ],
          },
        ],
        suspended: [],
        awaitingApproval: [],
        totalAdas: 10,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
      } as AdasToReview)
    })
  })
})

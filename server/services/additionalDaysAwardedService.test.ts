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

const threeAdjudicationSummary = JSON.parse(
  '{"results":' +
    '     {"content":' +
    '       [' +
    '         {' +
    '           "adjudicationNumber":1525916,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '           "adjudicationCharges":' +
    '             [' +
    '                {"oicChargeId":"1525916/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '             ]' +
    '         },' +
    '         {' +
    '             "adjudicationNumber":1525917,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '             "adjudicationCharges":' +
    '               [' +
    '                  {"oicChargeId":"1525917/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '               ]' +
    '           },' +
    '         {' +
    '             "adjudicationNumber":1525918,"reportTime":"2023-08-02T09:09:00","agencyIncidentId":1503215,"agencyId":"MDI","partySeq":1,' +
    '             "adjudicationCharges":' +
    '               [' +
    '                  {"oicChargeId":"1525917/1","offenceCode":"51:16","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","findingCode":"PROVED"}' +
    '               ]' +
    '           }' +
    '       ]' +
    '     }' +
    '  }',
) as AdjudicationSearchResponse

const adjudicationOne = JSON.parse(
  '{"adjudicationNumber":1525916,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationTwo = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationThree = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-04T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeWithTwoSanctions = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-04T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}, {"sanctionType":"Additional Days Added","sanctionDays":99,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16}]}]}]}',
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

const adjustmentRTesponsesWithChargeNumber = [
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
    it('Get adjudications ', async () => {
      const nomsId = 'AA1234A'
      adjudicationsApi.get('/adjudications/AA1234A/adjudications?size=1000', '').reply(200, threeAdjudicationSummary)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525916', '').reply(200, adjudicationOne)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525917', '').reply(200, adjudicationTwo)
      adjudicationsApi.get('/adjudications/AA1234A/charge/1525918', '').reply(200, adjudicationThreeWithTwoSanctions)
      adjustmentApi.get(`/adjustments?person=${nomsId}`).reply(200, adjustmentRTesponsesWithChargeNumber)
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
                toBeServed: 'TODO',
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'TODO',
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
                toBeServed: 'TODO',
              },
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-04'),
                days: 99,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED',
                toBeServed: 'TODO',
              },
            ],
          },
        ],
        suspendedOrQuashed: [],
        awaitingApproval: [],
        totalAdas: 114,
        totalAwaitingApproval: 0,
        totalSuspendedOrQuashed: 0,
      } as AdasToReview)
    })
  })
})

import nock from 'nock'
import { Request } from 'express'
import AdditionalDaysAwardedService from './additionalDaysAwardedService'
import config from '../config'
import { AdjudicationSearchResponse, IndividualAdjudication } from '../@types/adjudications/adjudicationTypes'
import { AdaIntercept, AdasToReview, AdasToView, PadasToReview } from '../@types/AdaTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import AdjustmentsService from './adjustmentsService'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'

jest.mock('../data/hmppsAuthClient')
jest.mock('./additionalDaysApprovalStoreService')
jest.mock('./adjustmentsService')

const storeService = new AdditionalDaysAwardedStoreService() as jest.Mocked<AdditionalDaysAwardedStoreService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const adaService = new AdditionalDaysAwardedService(storeService, adjustmentsService)

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

const oneAdjudicationSearchResponse = JSON.parse(
  `{"results": [${adjudication1SearchResponse}] }`,
) as AdjudicationSearchResponse

const twoAdjudicationsSearchResponse = JSON.parse(
  `{"results": [${adjudication1SearchResponse}, ${adjudication2SearchResponse}] }`,
) as AdjudicationSearchResponse

const threeAdjudicationsSearchResponse = JSON.parse(
  `{"results": [${adjudication1SearchResponse}, ${adjudication2SearchResponse}, ${adjudication3SearchResponse}] }`,
) as AdjudicationSearchResponse

const emptyAdjudicationSearchResponse = JSON.parse(`{"results": [] }`) as AdjudicationSearchResponse

const adjudicationOne = JSON.parse(
  '{"adjudicationNumber":1525916,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationOneQuashed = JSON.parse(
  '{"adjudicationNumber":1525916,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Quashed","sanctionSeq":15}]}]}]}',
) as IndividualAdjudication

const adjudicationTwo = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16}]}]}]}',
) as IndividualAdjudication

const adjudicationOneProspective = JSON.parse(
  '{"adjudicationNumber":1525916,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Prospective","sanctionSeq":15}]}]}]}',
)
const adjudicationThreeWithTwoSanctions = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-04T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":17}, {"sanctionType":"Additional Days Added","sanctionDays":99,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":18}]}]}]}',
) as IndividualAdjudication

const adjudicationTwoConsecutiveToOne = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16, "consecutiveSanctionSeq": 15}]}]}]}',
) as IndividualAdjudication

const adjudicationTwoConsecutiveToOneQuashed = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Quashed","sanctionSeq":16, "consecutiveSanctionSeq": 15}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeConcurrentToOne = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":17}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeConcurrentToOneQuashed = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Quashed","sanctionSeq":17}]}]}]}',
) as IndividualAdjudication

const adjudicationTwoConsecToNonAda = JSON.parse(
  '{"adjudicationNumber":1525917,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"Additional Days Added","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":16, "consecutiveSanctionSeq": 17}]}]}]}',
) as IndividualAdjudication

const adjudicationThreeNonAda = JSON.parse(
  '{"adjudicationNumber":1525918,"incidentTime":"2023-08-01T09:00:00","establishment":"Moorland (HMP & YOI)","interiorLocation":"Circuit","incidentDetails":"some details","reportNumber":1503215,"reportType":"Governor\'s Report","reporterFirstName":"TIM","reporterLastName":"WRIGHT","reportTime":"2023-08-02T09:09:00","hearings":[{"oicHearingId":2012687,"hearingType":"Governor\'s Hearing Adult","hearingTime":"2023-08-03T16:45:00","establishment":"Moorland (HMP & YOI)","location":"Adj","heardByFirstName":"JOHN","heardByLastName":"FERGUSON","results":[{"oicOffenceCode":"51:16","offenceType":"Prison Rule 51","offenceDescription":"Intentionally or recklessly sets fire to any part of a prison or any other property, whether or not his own","plea":"Guilty","finding":"Charge Proved","sanctions":[{"sanctionType":"non-ADA","sanctionDays":5,"effectiveDate":"2023-08-09T00:00:00","status":"Immediate","sanctionSeq":17}]}]}]}',
) as IndividualAdjudication

const adjudicationOneAdjustment = {
  id: '8569b6d4-9c6f-48d2-83db-bb5091f1011e',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: [1525916] },
} as Adjustment
const adjudicationTwoAdjustment = {
  id: 'd8069e08-5334-4f90-b59d-1748afbcfa6f',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: [1525917] },
} as Adjustment
const adjudicationThreeAdjustment = {
  id: 'a44b3d0b-3c56-4035-86d2-5ff75a85adfa',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  additionalDaysAwarded: { adjudicationId: [1525918] },
} as Adjustment

const adjustmentResponsesWithChargeNumber = [
  adjudicationOneAdjustment,
  adjudicationTwoAdjustment,
  adjudicationThreeAdjustment,
]

describe('Additional Days Added Service', () => {
  let prisonApi: nock.Scope

  beforeEach(() => {
    config.apis.prisonApi.url = 'http://localhost:8100'
    prisonApi = nock(config.apis.prisonApi.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })
  describe('ADA Review screen', () => {
    it('Get concurrent adjudications ', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwo)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeWithTwoSanctions)
      adjustmentsService.findByPerson.mockResolvedValue(adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awaitingApproval: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 16,
              },
            ],
            total: 5,
            status: 'PENDING APPROVAL',
          },
          {
            dateChargeProved: new Date('2023-08-04'),
            charges: [
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-04'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 17,
              },
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-04'),
                days: 99,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 18,
              },
            ],
            total: 99,
            status: 'PENDING APPROVAL',
          },
        ],
        suspended: [],
        awarded: [],
        quashed: [],
        totalAwarded: 0,
        totalQuashed: 0,
        totalAwaitingApproval: 104,
        totalSuspended: 0,
        intercept: {
          number: 2,
          type: 'UPDATE',
          anyProspective: false,
        },
        showExistingAdaMessage: false,
        totalExistingAdads: null,
      } as AdasToReview)
    })

    it('Get adjudication where only one charge exists', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, oneAdjudicationSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      adjustmentsService.findByPerson.mockResolvedValue(adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awaitingApproval: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
            ],
            total: 5,
            status: 'PENDING APPROVAL',
          },
        ],
        suspended: [],
        awarded: [],
        quashed: [],
        totalAwarded: 0,
        totalQuashed: 0,
        totalAwaitingApproval: 5,
        totalSuspended: 0,
        intercept: {
          number: 1,
          type: 'UPDATE',
          anyProspective: false,
        },
        showExistingAdaMessage: false,
        totalExistingAdads: null,
      } as AdasToReview)
    })

    it('Get adjudication where consecutive charges exist', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, twoAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      adjustmentsService.findByPerson.mockResolvedValue(adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awaitingApproval: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Consecutive to 1525916',
                sequence: 16,
                consecutiveToSequence: 15,
              },
            ],
            total: 10,
            status: 'PENDING APPROVAL',
          },
        ],
        suspended: [],
        awarded: [],
        quashed: [],
        totalAwarded: 0,
        totalQuashed: 0,
        totalAwaitingApproval: 10,
        totalSuspended: 0,
        intercept: {
          number: 1,
          type: 'UPDATE',
          anyProspective: false,
        },
        showExistingAdaMessage: false,
        totalExistingAdads: null,
      } as AdasToReview)
    })

    it('Get adjudication where a mix of consecutive and concurrent charges exist', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeConcurrentToOne)
      adjustmentsService.findByPerson.mockResolvedValue([
        {
          id: 'c5b61b4e-8b47-4dfc-b88b-5eb58fc04691',
          person: 'AA1234A',
          bookingId: 1234,
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          fromDate: '2023-08-03',
          days: 10,
          additionalDaysAwarded: { adjudicationId: [1525916, 1525917, 1525918], prospective: false },
        },
      ])
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awarded: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Consecutive to 1525916',
                sequence: 16,
                consecutiveToSequence: 15,
              },
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 17,
              },
            ],
            total: 10,
            status: 'AWARDED',
            adjustmentId: 'c5b61b4e-8b47-4dfc-b88b-5eb58fc04691',
          },
        ],
        suspended: [],
        quashed: [],
        awaitingApproval: [],
        totalAwarded: 10,
        totalQuashed: 0,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
        intercept: {
          number: 0,
          type: 'NONE',
          anyProspective: false,
        },
        showExistingAdaMessage: false,
        totalExistingAdads: 10,
      } as AdasToReview)
    })

    it('View adjustments for adjudications awarded.', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeConcurrentToOne)
      adjustmentsService.findByPerson.mockResolvedValue([
        {
          id: 'c5b61b4e-8b47-4dfc-b88b-5eb58fc04691',
          person: 'AA1234A',
          bookingId: 1234,
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          fromDate: '2023-08-03',
          days: 10,
          additionalDaysAwarded: { adjudicationId: [1525916, 1525917, 1525918], prospective: false },
        },
      ])
      const startOfSentenceEnvelope = new Date('2023-01-01')

      const adasToView: AdasToView = await adaService.viewAdjustments(nomsId, startOfSentenceEnvelope, token)

      expect(adasToView).toEqual({
        awarded: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Consecutive to 1525916',
                sequence: 16,
                consecutiveToSequence: 15,
              },
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 17,
              },
            ],
            total: 10,
            status: 'AWARDED',
            adjustmentId: 'c5b61b4e-8b47-4dfc-b88b-5eb58fc04691',
          },
        ],
        totalAwarded: 10,
      } as AdasToView)
    })

    it('Get adjudication where adjustment has been quashed', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOneQuashed)
      prisonApi
        .get('/api/offenders/AA1234A/adjudications/1525917', '')
        .reply(200, adjudicationTwoConsecutiveToOneQuashed)
      prisonApi
        .get('/api/offenders/AA1234A/adjudications/1525918', '')
        .reply(200, adjudicationThreeConcurrentToOneQuashed)
      adjustmentsService.findByPerson.mockResolvedValue([
        {
          id: 'c5b61b4e-8b47-4dfc-b88b-5eb58fc04691',
          person: 'AA1234A',
          bookingId: 1234,
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          fromDate: '2023-08-03',
          days: 10,
          additionalDaysAwarded: { adjudicationId: [1525916, 1525917, 1525918], prospective: false },
        },
      ])
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        quashed: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'QUASHED',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'QUASHED',
                toBeServed: 'Consecutive to 1525916',
                sequence: 16,
                consecutiveToSequence: 15,
              },
              {
                chargeNumber: 1525918,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'QUASHED',
                toBeServed: 'Concurrent',
                sequence: 17,
              },
            ],
            total: 10,
            status: 'PENDING APPROVAL',
          },
        ],
        suspended: [],
        awarded: [],
        awaitingApproval: [],
        totalAwarded: 0,
        totalQuashed: 10,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
        intercept: {
          number: 1,
          type: 'UPDATE',
          anyProspective: false,
        },
        showExistingAdaMessage: false,
        totalExistingAdads: 10,
      } as AdasToReview)
    })
    it('Get adjudication where prospective ada exists and selected', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, oneAdjudicationSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOneProspective)
      adjustmentsService.findByPerson.mockResolvedValue([])

      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.getSelectedPadas.mockReturnValue(['2023-08-03'])

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awaitingApproval: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'PROSPECTIVE',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
            ],
            total: 5,
            status: 'PENDING APPROVAL',
          },
        ],
        suspended: [],
        awarded: [],
        quashed: [],
        totalAwarded: 0,
        totalQuashed: 0,
        totalAwaitingApproval: 5,
        totalSuspended: 0,
        intercept: {
          number: 1,
          type: 'UPDATE',
          anyProspective: true,
        },
        showExistingAdaMessage: false,
        totalExistingAdads: null,
      } as AdasToReview)
    })

    it('Get adjudication where prospective ada exists and not selected', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, oneAdjudicationSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOneProspective)
      adjustmentsService.findByPerson.mockResolvedValue([])

      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.getSelectedPadas.mockReturnValue([])

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awaitingApproval: [],
        suspended: [],
        awarded: [],
        quashed: [],
        totalAwarded: 0,
        totalQuashed: 0,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
        intercept: {
          number: 1,
          type: 'PADA',
          anyProspective: true,
        },
        showExistingAdaMessage: true,
        totalExistingAdads: null,
      } as AdasToReview)
    })

    it('Get adjudication where ADA adjustment exists and no matching adjudications', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, emptyAdjudicationSearchResponse)
      adjustmentsService.findByPerson.mockResolvedValue([
        {
          id: 'c5b61b4e-8b47-4dfc-b88b-5eb58fc04691',
          person: 'AA1234A',
          bookingId: 1234,
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          fromDate: '2023-08-03',
          days: 10,
          effectiveDays: 10,
        },
      ])
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.getSelectedPadas.mockReturnValue([])

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awaitingApproval: [],
        suspended: [],
        awarded: [],
        quashed: [],
        totalAwarded: 0,
        totalQuashed: 0,
        totalAwaitingApproval: 0,
        totalSuspended: 0,
        intercept: {
          number: 0,
          type: 'FIRST_TIME',
          anyProspective: false,
        },
        showExistingAdaMessage: true,
        totalExistingAdads: 10,
      } as AdasToReview)
    })

    it('Get padas where prospective ada exists', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, oneAdjudicationSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOneProspective)
      adjustmentsService.findByPerson.mockResolvedValue([])
      const startOfSentenceEnvelope = new Date('2023-01-01')

      const padaToReview: PadasToReview = await adaService.getPadasToApprove(nomsId, startOfSentenceEnvelope, token)

      expect(padaToReview).toEqual({
        prospective: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'PROSPECTIVE',
                toBeServed: 'Forthwith',
                sequence: 15,
              },
            ],
            total: 5,
            status: 'PENDING APPROVAL',
          },
        ],
        totalProspective: 5,
      } as PadasToReview)
    })

    it('Get adjudication where ada is consecutive to a non-ada - edge case, this  really stems from bad data in nomis ', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecToNonAda)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeNonAda)
      adjustmentsService.findByPerson.mockResolvedValue(adjustmentResponsesWithChargeNumber)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>

      const adaToReview: AdasToReview = await adaService.getAdasToApprove(
        request,
        nomsId,
        startOfSentenceEnvelope,
        token,
      )

      expect(adaToReview).toEqual({
        awaitingApproval: [
          {
            dateChargeProved: new Date('2023-08-03'),
            charges: [
              {
                chargeNumber: 1525916,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 15,
              },
              {
                chargeNumber: 1525917,
                dateChargeProved: new Date('2023-08-03'),
                days: 5,
                heardAt: 'Moorland (HMP & YOI)',
                status: 'AWARDED_OR_PENDING',
                toBeServed: 'Concurrent',
                sequence: 16,
                consecutiveToSequence: 17,
              },
            ],
            total: 5,
            status: 'PENDING APPROVAL',
          },
        ],
        suspended: [],
        awarded: [],
        quashed: [],
        totalAwarded: 0,
        totalAwaitingApproval: 5,
        totalQuashed: 0,
        totalSuspended: 0,
        intercept: {
          number: 1,
          type: 'UPDATE',
          anyProspective: false,
        },
        showExistingAdaMessage: false,
        totalExistingAdads: null,
      } as AdasToReview)
    })

    it('Approve ADAs where a mix of consecutive and concurrent charges exist', async () => {
      const nomsId = 'AA1234A'
      const bookingId = '1234'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeConcurrentToOne)
      adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue(adjustmentResponsesWithChargeNumber)

      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.setLastApprovedDate.mockReturnValue()
      await adaService.submitAdjustments(
        request,
        {
          prisonerNumber: nomsId,
          bookingId,
        } as PrisonerSearchApiPrisoner,
        startOfSentenceEnvelope,
        token,
      )
      expect(storeService.setLastApprovedDate.mock.calls).toHaveLength(1)
      expect(adjustmentsService.delete).toHaveBeenCalledTimes(3)
      expect(adjustmentsService.create).toHaveBeenCalledTimes(1)
    })
    it('Should intercept mix of concurrent consec', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeConcurrentToOne)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.getLastApprovedDate.mockReturnValue(null)
      const intercept = await adaService.shouldIntercept(request, nomsId, [], startOfSentenceEnvelope, token)

      expect(intercept).toEqual({
        type: 'UPDATE',
        number: 1,
        anyProspective: false,
      } as AdaIntercept)
    })
    it('Shouldnt intercept when already persisted in adjustment api', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeConcurrentToOne)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.getLastApprovedDate.mockReturnValue(null)
      const intercept = await adaService.shouldIntercept(
        request,
        nomsId,
        [
          {
            person: 'AA1234A',
            bookingId: 1234,
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            fromDate: '2023-08-03',
            days: 10,
            additionalDaysAwarded: { adjudicationId: [1525916, 1525917, 1525918], prospective: false },
          },
        ],
        startOfSentenceEnvelope,
        'username',
      )

      expect(intercept).toEqual({
        type: 'NONE',
        number: 0,
        anyProspective: false,
      } as AdaIntercept)
    })

    it('Should intercept when already persisted adjustment has different days', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOne)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525918', '').reply(200, adjudicationThreeConcurrentToOne)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.getLastApprovedDate.mockReturnValue(null)
      const intercept = await adaService.shouldIntercept(
        request,
        nomsId,
        [
          {
            person: 'AA1234A',
            bookingId: 1234,
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            fromDate: '2023-08-03',
            days: 5,
            additionalDaysAwarded: { adjudicationId: [1525916, 1525917, 1525918], prospective: false },
          },
        ],
        startOfSentenceEnvelope,
        'username',
      )

      expect(intercept).toEqual({
        type: 'UPDATE',
        number: 1,
        anyProspective: false,
      } as AdaIntercept)
    })
    it('Shouldnt intercept when recently saved prospective', async () => {
      const nomsId = 'AA1234A'
      prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, oneAdjudicationSearchResponse)
      prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOneProspective)
      const startOfSentenceEnvelope = new Date('2023-01-01')
      const request = {} as jest.Mocked<Request>
      storeService.getLastApprovedDate.mockReturnValue(new Date())
      const intercept = await adaService.shouldIntercept(request, nomsId, [], startOfSentenceEnvelope, 'username')

      expect(intercept).toEqual({
        type: 'NONE',
        number: 0,
        anyProspective: false,
      } as AdaIntercept)
    })
  })

  it('Shouldnt intercept when there are no non recall sentences', async () => {
    const nomsId = 'AA1234A'
    const startOfSentenceEnvelope: Date = null
    const request = {} as jest.Mocked<Request>
    storeService.getLastApprovedDate.mockReturnValue(new Date())
    const intercept = await adaService.shouldIntercept(request, nomsId, [], startOfSentenceEnvelope, token)

    expect(intercept).toEqual({
      type: 'NONE',
      number: 0,
      anyProspective: false,
    } as AdaIntercept)
  })

  it('Should intercept if all adas quashed', async () => {
    const nomsId = 'AA1234A'
    prisonApi.get('/api/offenders/AA1234A/adjudications', '').reply(200, threeAdjudicationsSearchResponse)
    prisonApi.get('/api/offenders/AA1234A/adjudications/1525916', '').reply(200, adjudicationOneQuashed)
    prisonApi.get('/api/offenders/AA1234A/adjudications/1525917', '').reply(200, adjudicationTwoConsecutiveToOneQuashed)
    prisonApi
      .get('/api/offenders/AA1234A/adjudications/1525918', '')
      .reply(200, adjudicationThreeConcurrentToOneQuashed)
    const startOfSentenceEnvelope = new Date('2023-01-01')
    const request = {} as jest.Mocked<Request>

    const intercept = await adaService.shouldIntercept(
      request,
      nomsId,
      [
        {
          id: 'c5b61b4e-8b47-4dfc-b88b-5eb58fc04691',
          person: 'AA1234A',
          bookingId: 1234,
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          fromDate: '2023-08-03',
          days: 10,
          additionalDaysAwarded: { adjudicationId: [1525916, 1525917, 1525918], prospective: false },
        },
      ],
      startOfSentenceEnvelope,
      'username',
    )

    expect(intercept).toEqual({
      type: 'UPDATE',
      number: 1,
      anyProspective: false,
    } as AdaIntercept)
  })
})

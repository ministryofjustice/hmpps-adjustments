import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdditionalDaysAwardedBackendService from '../services/additionalDaysAwardedBackendService'
import { AdasToReview } from '../@types/AdaTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import ReviewAndSubmitAdaViewModel from '../model/reviewAndSubmitAdaViewModel'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/additionalDaysAwardedBackendService')

const prisonerService = new PrisonerService() as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService() as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const additionalDaysAwardedBackendService = new AdditionalDaysAwardedBackendService(
  null,
  null,
) as jest.Mocked<AdditionalDaysAwardedBackendService>

const NOMS_ID = 'ABC123'

const allPadas = {
  awaitingApproval: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
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
} as AdasToReview

const noAwaitingApproval = {
  awaitingApproval: [],
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
} as AdasToReview

const padasAwaitingApprovalAndQuashed = {
  awaitingApproval: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'AWARDED_OR_PENDING',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
    },
  ],
  suspended: [],
  awarded: [],
  quashed: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          dateChargeProved: '2023-08-03',
          chargeNumber: '1526230',
          heardAt: 'Kirkham (HMP)',
          status: 'QUASHED',
          days: 25,
          toBeServed: 'Forthwith',
        },
      ],
      total: 25,
      status: 'PENDING_APPROVAL',
    },
  ],
  totalAwarded: 0,
  totalQuashed: 0,
  totalAwaitingApproval: 104,
  totalSuspended: 0,
  intercept: {
    number: 2,
    type: 'UPDATE',
    anyProspective: false,
  },
} as AdasToReview

const mixPadasAndPending = {
  awaitingApproval: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'AWARDED_OR_PENDING',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
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
  totalExistingAdas: null,
} as AdasToReview

let app: Express

const defaultUser = user

let userInTest = defaultUser

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      identifyRemandPeriodsService,
      adjustmentsStoreService,
      additionalDaysAwardedBackendService,
    },
    userSupplier: () => userInTest,
  })
})

afterEach(() => {
  userInTest = defaultUser
  jest.resetAllMocks()
})

describe('Additional Days Awarded routes tests', () => {
  describe('Review and approve tests', () => {
    it('GET /{nomsId}/additional-days/review-and-approve when only PADAs exist redirects to review and submit', () => {
      prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
        earliestSentence: new Date(),
        earliestExcludingRecalls: new Date(),
      })
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(allPadas)

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-approve`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}/additional-days/review-and-submit?referrer=REVIEW_PROSPECTIVE`)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when no awaiting approval records exist does not redirect', () => {
      prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
        earliestSentence: new Date(),
        earliestExcludingRecalls: new Date(),
      })
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(noAwaitingApproval)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when quashed records exist does not redirect', () => {
      prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
        earliestSentence: new Date(),
        earliestExcludingRecalls: new Date(),
      })
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(padasAwaitingApprovalAndQuashed)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when mix of PADAs and others exist does not redirect', () => {
      prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
        earliestSentence: new Date(),
        earliestExcludingRecalls: new Date(),
      })
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(mixPadasAndPending)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })
    it('GET /{nomsId}/additional-days/review-and-approve when no matching adjudication exists', () => {
      prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
        earliestSentence: new Date(),
        earliestExcludingRecalls: new Date(),
      })
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue({
        ...noAwaitingApproval,
        showExistingAdaMessage: true,
        totalExistingAdas: 10,
        adjustmentsToRemove: [
          {
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: false },
            bookingId: 123,
            days: 10,
            fromDate: '2023-08-03',
            person: NOMS_ID,
            prisonId: undefined,
          } as Adjustment,
        ],
      })

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-approve`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Review and delete ADAs')
          expect(res.text).toContain('Pending deletion')
          expect(res.text).toContain('03 Aug 2023')
          expect(res.text).toContain('Total ADAs removed from calculation')
          expect(res.text).toContain('10')
        })
    })

    it('GET /{nomsId}/additional-days/review-and-submit when no matching adjudication exists', () => {
      prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
        earliestSentence: new Date(),
        earliestExcludingRecalls: new Date(),
      })
      additionalDaysAwardedBackendService.getReviewAndSubmitModel.mockResolvedValue(
        new ReviewAndSubmitAdaViewModel(
          [],
          [
            {
              adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
              additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: false },
              bookingId: 123,
              days: 10,
              fromDate: '2023-08-03',
              person: NOMS_ID,
              prisonId: undefined,
            } as Adjustment,
          ],
          [],
        ),
      )

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-submit`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Total ADAs removed from calculation')
          expect(res.text).toContain('10')
        })
    })
  })
})

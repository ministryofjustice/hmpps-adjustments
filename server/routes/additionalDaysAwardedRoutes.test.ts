import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import { AdasToReview } from '../@types/AdaTypes'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/additionalDaysAwardedService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService() as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const additionalDaysAwardedService = new AdditionalDaysAwardedService(
  null,
  null,
) as jest.Mocked<AdditionalDaysAwardedService>

const NOMS_ID = 'ABC123'

const stubbedPrisonerData = {
  offenderNo: NOMS_ID,
  firstName: 'Anon',
  lastName: 'Nobody',
  dateOfBirth: '24/06/2000',
  bookingId: 12345,
  agencyId: 'LDS',
} as PrisonApiPrisoner

const allPadas = {
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
          toBeServed: 'Concurrent',
          sequence: 15,
        },
        {
          chargeNumber: 1525917,
          dateChargeProved: new Date('2023-08-03'),
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
          sequence: 16,
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
      dateChargeProved: new Date('2023-08-03'),
      charges: [
        {
          chargeNumber: 1525916,
          dateChargeProved: new Date('2023-08-03'),
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
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
  ],
  suspended: [],
  awarded: [],
  quashed: [
    {
      dateChargeProved: new Date('2023-08-03'),
      charges: [
        {
          dateChargeProved: new Date('2023-08-03'),
          chargeNumber: 1526230,
          heardAt: 'Kirkham (HMP)',
          status: 'QUASHED',
          days: 25,
          sequence: 2,
          toBeServed: 'Forthwith',
        },
      ],
      total: 25,
      status: 'PENDING APPROVAL',
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
      dateChargeProved: new Date('2023-08-03'),
      charges: [
        {
          chargeNumber: 1525916,
          dateChargeProved: new Date('2023-08-03'),
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
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
      additionalDaysAwardedService,
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
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      prisonerService.getStartOfSentenceEnvelopeExcludingRecalls.mockResolvedValue(new Date())
      additionalDaysAwardedService.getAdasToApprove.mockResolvedValue(allPadas)

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-approve`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}/additional-days/review-and-submit?referrer=REVIEW_PROSPECTIVE`)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when no awaiting approval records exist does not redirect', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      prisonerService.getStartOfSentenceEnvelopeExcludingRecalls.mockResolvedValue(new Date())
      additionalDaysAwardedService.getAdasToApprove.mockResolvedValue(noAwaitingApproval)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when quashed records exist does not redirect', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      prisonerService.getStartOfSentenceEnvelopeExcludingRecalls.mockResolvedValue(new Date())
      additionalDaysAwardedService.getAdasToApprove.mockResolvedValue(padasAwaitingApprovalAndQuashed)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when mix of PADAs and others exist does not redirect', () => {
      prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
      prisonerService.getStartOfSentenceEnvelopeExcludingRecalls.mockResolvedValue(new Date())
      additionalDaysAwardedService.getAdasToApprove.mockResolvedValue(mixPadasAndPending)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })
  })
})

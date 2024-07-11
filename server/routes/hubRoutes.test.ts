import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import UnusedDeductionsService from '../services/unusedDeductionsService'
import { Remand, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { AdaAdjudicationDetails, Adjustment } from '../@types/adjustments/adjustmentsTypes'
import './testutils/toContainInOrder'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/unusedDeductionsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const unusedDeductionsService = new UnusedDeductionsService(null, null, null) as jest.Mocked<UnusedDeductionsService>

const remandResult = {
  chargeRemand: [],
  sentenceRemand: [
    {
      days: 20,
    } as Remand,
  ],
} as RemandResult

const radaAdjustment = {
  id: '1',
  adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
  toDate: null,
  fromDate: '2023-04-05',
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
  days: 24,
} as Adjustment

const adaAdjustment = {
  id: '1',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  toDate: null,
  fromDate: '2023-04-05',
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
  days: 24,
} as Adjustment

const noInterceptAdjudication = {
  intercept: {
    type: 'NONE',
    number: 1,
  },
} as AdaAdjudicationDetails

const defaultUser = user
const userWithRemandRole = { ...user, roles: ['REMAND_IDENTIFIER'] }
const userWithSupportRole = { ...user, roles: ['COURTCASE_RELEASEDATE_SUPPORT'], isSupportUser: true }

const NOMS_ID = 'ABC123'

let userInTest = defaultUser
let app: Express

beforeEach(() => {
  userInTest = defaultUser
  app = appWithAllRoutes({
    services: { prisonerService, adjustmentsService, identifyRemandPeriodsService, unusedDeductionsService },
    userSupplier: () => userInTest,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /:nomsId', () => {
  it('should render prisoner details', () => {
    adjustmentsService.findByPerson.mockResolvedValue([])
    return request(app)
      .get('/ABC123')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('data-qa="mini-profile-prisoner-number">ABC123')
        expect(res.text).toContain('mini-profile-status">Life imprisonment<')
      })
  })
  it('GET /{nomsId} with remand role', () => {
    userInTest = userWithRemandRole
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [{ ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }],
    ])
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Nobody may have 20 days remand')
      })
  })
  it('GET /{nomsId} is intercepted if there is adas to review', () => {
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue(['UNKNOWN', []])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue({
      ...noInterceptAdjudication,
      intercept: {
        type: 'FIRST_TIME',
        number: 5,
        anyProspective: true,
        messageArguments: [],
      },
    })
    return request(app).get(`/${NOMS_ID}`).expect(302).expect('Location', `/${NOMS_ID}/additional-days/intercept`)
  })
  it('GET /{nomsId} is not intercepted if its a support user', () => {
    userInTest = userWithSupportRole
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue(['UNKNOWN', []])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue({
      ...noInterceptAdjudication,
      intercept: {
        type: 'FIRST_TIME',
        number: 5,
        anyProspective: true,
        messageArguments: [],
      },
    })
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
      })
  })
  it('GET /{nomsId} hub has link to review PADAs', () => {
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'UNKNOWN',
      [
        {
          ...adaAdjustment,
          prisonName: 'Leeds',
          lastUpdatedDate: '2023-04-05',
          additionalDaysAwarded: { adjudicationId: [], prospective: true },
        },
      ],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue({
      ...noInterceptAdjudication,
      prospective: [
        {
          charges: [],
          dateChargeProved: '2024-01-01',
        },
      ],
      intercept: {
        type: 'NONE',
        number: 0,
        anyProspective: true,
        messageArguments: [],
      },
    })
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('<a href="/ABC123/additional-days/review-prospective">Review unapplied PADAs</a>')
      })
  })
  it('GET /{nomsId} hub shows error from missing recall court event', () => {
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue(['NONE', []])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue({
      ...noInterceptAdjudication,
      recallWithMissingOutcome: true,
    })
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('An active recall sentence is present with no associated court event.')
      })
  })

  it('GET /{nomsId} relevant remand throws error', () => {
    adjustmentsService.findByPerson.mockResolvedValue([radaAdjustment])
    identifyRemandPeriodsService.calculateRelevantRemand.mockRejectedValue(remandResult)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Nobody may have 20 days remand')
      })
  })
})

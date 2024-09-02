import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import UnusedDeductionsService from '../services/unusedDeductionsService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import './testutils/toContainInOrder'
import ParamStoreService from '../services/paramStoreService'
import SessionAdjustment from '../@types/AdjustmentTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/unusedDeductionsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/paramStoreService')
jest.mock('../services/calculateReleaseDatesService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const unusedDeductionsService = new UnusedDeductionsService(null, null) as jest.Mocked<UnusedDeductionsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const paramStoreService = new ParamStoreService() as jest.Mocked<ParamStoreService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>

const remandAdjustment = {
  id: '1',
  adjustmentType: 'REMAND',
  fromDate: '2023-04-05',
  toDate: '2023-06-05',
  person: 'ABC123',
  effectiveDays: 14,
  bookingId: 12345,
  sentenceSequence: 1,
  prisonId: 'LDS',
  days: 24,
  remand: {
    chargeId: [123],
  },
} as Adjustment

const unusedDeductions = {
  id: '1',
  adjustmentType: 'UNUSED_DEDUCTIONS',
  toDate: null,
  fromDate: '2023-04-05',
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
  days: 10,
  effectiveDays: 10,
} as Adjustment

const defaultUser = user

const NOMS_ID = 'ABC123'

let userInTest = defaultUser
let app: Express

beforeEach(() => {
  userInTest = defaultUser
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      identifyRemandPeriodsService,
      unusedDeductionsService,
      adjustmentsStoreService,
      paramStoreService,
      calculateReleaseDatesService,
    },
    userSupplier: () => userInTest,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Unit tests for review unused deductions journey.', () => {
  it('GET /{nomsId}/review-deductions/save Review deductions - confirm', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments['85'] = remandAdjustment
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    adjustmentsService.findByPerson.mockResolvedValue([unusedDeductions])
    calculateReleaseDatesService.unusedDeductionsHandlingCRDError.mockResolvedValue({
      unusedDeductions: 10,
      validationMessages: [],
    })
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    paramStoreService.get.mockReturnValue(true)
    return request(app)
      .get(`/${NOMS_ID}/review-deductions/confirm`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'When you save this remand. The unused deductions will automatically be recorded. Check that the unused remand alert has been added.',
        )
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('10')
      })
  })
})

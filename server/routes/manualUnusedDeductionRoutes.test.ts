import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import UnusedDeductionsService from '../services/unusedDeductionsService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import './testutils/toContainInOrder'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import ParamStoreService from '../services/paramStoreService'
import SessionAdjustment from '../@types/AdjustmentTypes'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

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

describe('Unit tests for manually setting unused deductions', () => {
  it('GET /{nomsId}/manual-unused-deductions/days/add Manual unused deductions - add', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    adjustmentsService.findByPerson.mockResolvedValue([])
    return request(app)
      .get(`/${NOMS_ID}/manual-unused-deductions/days/add`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the number of unused deductions')
      })
  })
  it('GET /{nomsId}/manual-unused-deductions/days/edit Manual unused deductions - edit', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    adjustmentsService.findByPerson.mockResolvedValue([unusedDeductions])
    return request(app)
      .get(`/${NOMS_ID}/manual-unused-deductions/days/edit`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Edit the number of unused deductions')
        expect(res.text).toContain('10')
      })
  })
  it('GET /{nomsId}/manual-unused-deductions/save Manual unused deductions - review - save', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    adjustmentsService.findByPerson.mockResolvedValue([unusedDeductions])
    adjustmentsStoreService.getOnly.mockReturnValue({
      adjustmentType: 'UNUSED_DEDUCTIONS',
      days: 10,
    } as SessionAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/manual-unused-deductions/save`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('10')
      })
  })
  it('GET /{nomsId}/manual-unused-deductions/delete Manual unused deductions - delete', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    adjustmentsService.findByPerson.mockResolvedValue([unusedDeductions])
    adjustmentsStoreService.getOnly.mockReturnValue({
      adjustmentType: 'UNUSED_DEDUCTIONS',
      days: 10,
    } as SessionAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/manual-unused-deductions/delete`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('10')
      })
  })
})

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
import config from '../config'
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
const unusedDeductionsService = new UnusedDeductionsService(null, null, null) as jest.Mocked<UnusedDeductionsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const paramStoreService = new ParamStoreService() as jest.Mocked<ParamStoreService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>

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

const noInterceptAdjudication = {
  intercept: {
    type: 'NONE',
    number: 1,
  },
} as AdaAdjudicationDetails

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

describe('GET /:nomsId', () => {
  it('GET /{nomsId} hub unused deductions cannot be calculated because of unsupported sentence type - With manual unused deductions enabled', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'UNSUPPORTED',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a href="/${NOMS_ID}/unused-deductions/days/add">add any unused deductions here.</a>`,
        )
      })
  })
  it('GET /{nomsId}/unused-deductions/days/add Manual unused deductions - add', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    adjustmentsService.findByPerson.mockResolvedValue([])
    return request(app)
      .get(`/${NOMS_ID}/unused-deductions/days/add`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the number of unused deductions')
      })
  })
  it('GET /{nomsId}/unused-deductions/days/edit Manual unused deductions - edit', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
    })
    adjustmentsService.findByPerson.mockResolvedValue([unusedDeductions])
    return request(app)
      .get(`/${NOMS_ID}/unused-deductions/days/edit`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Edit the number of unused deductions')
        expect(res.text).toContain('10')
      })
  })
  it('GET /{nomsId}/unused-deductions/review/save Manual unused deductions - review - save', () => {
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
      .get(`/${NOMS_ID}/unused-deductions/review/save`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('10')
      })
  })
  it('GET /{nomsId}/unused-deductions/review/delete Manual unused deductions - review - delete', () => {
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
      .get(`/${NOMS_ID}/unused-deductions/review/delete`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('10')
      })
  })
  it('GET /{nomsId}/unused-deductions/review/delete Review deductions - review', () => {
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
      .get(`/${NOMS_ID}/unused-deductions/review/save`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'When you save this remand. The unused deductions will automatically be recorded. Check that the unused remand alert has been added.',
        )
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('10')
      })
  })
  it('GET /{nomsId} hub with unused deductions', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [{ ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }, remandAdjustment, unusedDeductions],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).not.toContain('Nobody may have 20 days remand')
        expect(res.text).toContain('24')
        expect(res.text).toContainInOrder(['Last update', 'on 05 Apr 2023', 'by Leeds'])
        expect(res.text).toContain('including 10 days unused')
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of unsupported sentence type  - manual unused deductions enabled', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'UNSUPPORTED',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a href="/ABC123/unused-deductions/days/add">add any unused deductions here.</a>',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of validation error', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'VALIDATION',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Some of the data in NOMIS related to this person is incorrect. This means unused deductions cannot be automatically calculated.',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of recall sentence', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'RECALL',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Unused deductions cannot be calculated for recall sentences. To view or add unused deductions, go to the sentence adjustments screen in NOMIS.',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - with existing unused - Review unused deductions enabled', () => {
    config.featureToggles.reviewUnusedDeductions = true
    const nomisRemandAdjustment = { ...remandAdjustment }
    nomisRemandAdjustment.source = 'NOMIS'
    const nomisUnusedDeduction = { ...unusedDeductions }
    nomisUnusedDeduction.source = 'NOMIS'
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NOMIS_ADJUSTMENT',
      [nomisRemandAdjustment, nomisUnusedDeduction],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `Unused deductions have not been calculated as there are deductions in NOMIS - <a href="/ABC123/unused-deductions/review-deductions">review remand to calculate</a>`,
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - without existing unused - Review unused deductions enabled', () => {
    config.featureToggles.reviewUnusedDeductions = true
    const nomisRemandAdjustment = { ...remandAdjustment }
    nomisRemandAdjustment.source = 'NOMIS'
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NOMIS_ADJUSTMENT',
      [nomisRemandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    paramStoreService.get.mockReturnValue(false)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `Unused deductions have not been calculated - <a href="/ABC123/unused-deductions/review-deductions">review remand to calculate</a>`,
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - with existing unused - Review unused deductions disabled', () => {
    config.featureToggles.reviewUnusedDeductions = false
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NOMIS_ADJUSTMENT',
      [remandAdjustment, unusedDeductions],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Unused remand/tagged bail time cannot be calculated. There is unused remand in NOMIS. Go to the sentence adjustments screen on NOMIS to view it.',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - without existing unused - Review unused deductions disabled', () => {
    config.featureToggles.reviewUnusedDeductions = false
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NOMIS_ADJUSTMENT',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    paramStoreService.get.mockReturnValue(false)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Unused remand/tagged bail time cannot be calculated. Go to the sentence adjustments screen on NOMIS to view or add any unused deductions.',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of an exception', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'UNKNOWN',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    paramStoreService.get.mockReturnValue(false)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Unused remand/tagged bail time cannot be calculated. There may be some present. Any unused deductions must be entered or viewed in NOMIS.',
        )
      })
  })
})

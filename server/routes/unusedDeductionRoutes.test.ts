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

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/unusedDeductionsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const unusedDeductionsService = new UnusedDeductionsService(null, null, null) as jest.Mocked<UnusedDeductionsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>

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
    config.featureToggles.manualUnusedDeductions = true
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a href="/${NOMS_ID}/unused-deductions/days/add">add any unused deductions here.</a>`,
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of unsupported sentence type - With manual unused deductions disabled', () => {
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
    config.featureToggles.manualUnusedDeductions = false
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Some of the details recorded in NOMIS cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. To add any unused remand, go to the sentence adjustments screen in NOMIS.',
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
  it('GET /{nomsId} hub unused deductions cannot be calculated because of unsupported sentence type - manual unused deductions disabled', () => {
    config.featureToggles.manualUnusedDeductions = false
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
          'Some of the details recorded in NOMIS cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. To add any unused remand, go to the sentence adjustments screen in NOMIS.',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of unsupported sentence type  - manual unused deductions enabled', () => {
    config.featureToggles.manualUnusedDeductions = true
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
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - with existing unused', () => {
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
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - without existing unused', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NOMIS_ADJUSTMENT',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
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

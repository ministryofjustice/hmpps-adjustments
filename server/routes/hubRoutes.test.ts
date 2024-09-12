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
import ParamStoreService from '../services/paramStoreService'
import config from '../config'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/unusedDeductionsService')
jest.mock('../services/paramStoreService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const unusedDeductionsService = new UnusedDeductionsService(null, null) as jest.Mocked<UnusedDeductionsService>
const paramStoreService = new ParamStoreService() as jest.Mocked<ParamStoreService>

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
    services: {
      prisonerService,
      adjustmentsService,
      identifyRemandPeriodsService,
      unusedDeductionsService,
      paramStoreService,
    },
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
    paramStoreService.get.mockReturnValue(false)
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
          `Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a data-qa="manual-unused-deductions" href="/${NOMS_ID}/manual-unused-deductions/days/add">add any unused deductions here.</a>`,
        )
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
          'Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service. You can <a data-qa="manual-unused-deductions" href="/ABC123/manual-unused-deductions/days/add">add any unused deductions here.</a>',
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
          `Unused deductions have not been calculated as there are unused deductions in NOMIS - <a data-qa="review-unused-deductions" href="/ABC123/review-deductions">review remand to calculate</a>`,
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
          `Unused deductions have not been calculated - <a data-qa="review-unused-deductions" href="/ABC123/review-deductions">review remand to calculate</a>`,
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

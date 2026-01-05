import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import UnusedDeductionsService from '../services/unusedDeductionsService'
import { RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { AdaAdjudicationDetails, Adjustment } from '../@types/adjustments/adjustmentsTypes'
import './testutils/toContainInOrder'
import ParamStoreService from '../services/paramStoreService'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'
import RemandAndSentencingService from '../services/remandAndSentencingService'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/unusedDeductionsService')
jest.mock('../services/paramStoreService')
jest.mock('../services/courtCasesReleaseDatesService')
jest.mock('../services/remandAndSentencingService')

const remandAndSentencingService = new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>
const prisonerService = new PrisonerService(null, remandAndSentencingService) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const unusedDeductionsService = new UnusedDeductionsService(null, null) as jest.Mocked<UnusedDeductionsService>
const paramStoreService = new ParamStoreService() as jest.Mocked<ParamStoreService>
const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService(
  null,
) as jest.Mocked<CourtCasesReleaseDatesService>

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
  source: 'DPS',
} as Adjustment

const remandResult = {
  chargeRemand: [],
  adjustments: [
    {
      fromDate: '2024-01-01',
      toDate: '2024-01-20',
      status: 'ACTIVE',
    },
    {
      fromDate: '2023-01-01',
      toDate: '2023-01-20',
      status: 'INACTIVE',
    },
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

const lawfullyAtLargeAdjustment = {
  id: '3',
  adjustmentType: 'LAWFULLY_AT_LARGE',
  toDate: '2023-09-05',
  fromDate: '2023-07-05',
  lawfullyAtLarge: { affectsDates: 'YES' },
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
} as Adjustment

const noInterceptAdjudication = {
  intercept: {
    type: 'NONE',
    number: 1,
  },
} as AdaAdjudicationDetails

const serviceDefinitionsNoThingsToDo = {
  services: {
    overview: {
      href: 'http://localhost:8000/prisoner/AB1234AB/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    adjustments: {
      href: 'http://localhost:8002/AB1234AB',
      text: 'Adjustments',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=AB1234AB',
      text: 'Release dates and calculations',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
  },
} as CcrdServiceDefinitions

const serviceDefinitionsRemandThingsToDo = {
  services: {
    overview: {
      href: 'http://localhost:8000/prisoner/AB1234AB/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    adjustments: {
      href: 'http://localhost:8002/AB1234AB',
      text: 'Adjustments',
      thingsToDo: {
        things: [
          {
            title: 'There are periods of remand to review',
            message:
              'This service has identified periods of remand that may be relevant. You must review these remand periods before calculating a release date.',
            buttonText: 'Review remand',
            buttonHref: 'https://identify-remand-periods-dev.hmpps.service.justice.gov.uk/prisoner/A8902DZ',
            type: 'REVIEW_IDENTIFIED_REMAND',
          },
        ],
        count: 1,
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=AB1234AB',
      text: 'Release dates and calculations',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
  },
} as CcrdServiceDefinitions

const serviceDefinitionsProspectiveThingsToDo = {
  services: {
    overview: {
      href: 'http://localhost:8000/prisoner/AB1234AB/overview',
      text: 'Overview',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
    adjustments: {
      href: 'http://localhost:8002/AB1234AB',
      text: 'Adjustments',
      thingsToDo: {
        things: [
          {
            title: 'Review ADA adjudications',
            message: 'message',
            buttonText: 'Review ADA',
            buttonHref: 'http://localhost:8002/AB1234AB/additional-days/review-and-approve',
            type: 'ADA_INTERCEPT',
          },
        ],
        count: 1,
      },
    },
    releaseDates: {
      href: 'http://localhost:8004?prisonId=AB1234AB',
      text: 'Release dates and calculations',
      thingsToDo: {
        things: [],
        count: 0,
      },
    },
  },
} as CcrdServiceDefinitions

const defaultUser = user
const userWithRemandRole = { ...user, roles: ['REMAND_IDENTIFIER'] }

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
      courtCasesReleaseDatesService,
      remandAndSentencingService,
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

  describe('Identify Remand role tests', () => {
    it('GET /{nomsId} with remand role accepted remand', () => {
      userInTest = userWithRemandRole
      identifyRemandPeriodsService.getRemandDecision.mockResolvedValue({
        accepted: true,
      })
      identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue({
        adjustments: [],
      } as RemandResult)
      adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
      unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
        'NONE',
        [remandAdjustment],
      ])
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
      return request(app)
        .get(`/${NOMS_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Review remand')
          expect(res.text).toContain('View')
        })
    })
    it('GET /{nomsId} with remand role things to do', () => {
      userInTest = userWithRemandRole
      identifyRemandPeriodsService.getRemandDecision.mockResolvedValue({
        accepted: true,
      })
      identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue({
        adjustments: [],
      } as RemandResult)
      adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
      unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue(['NONE', []])
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsRemandThingsToDo)
      return request(app)
        .get(`/${NOMS_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Review remand')
          expect(res.text).not.toContain('data-qa="add-remand"')
        })
    })
    it('GET /{nomsId} with remand role rejected remand with days remand', () => {
      userInTest = userWithRemandRole
      identifyRemandPeriodsService.getRemandDecision.mockResolvedValue({
        accepted: false,
      })
      identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue({
        adjustments: [],
      } as RemandResult)
      adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
      unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
        'NONE',
        [remandAdjustment],
      ])
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
      return request(app)
        .get(`/${NOMS_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="add-remand"')
          expect(res.text).not.toContain('Review remand')
        })
    })
    it('GET /{nomsId} with remand role rejected remand with zero days remand', () => {
      userInTest = userWithRemandRole
      identifyRemandPeriodsService.getRemandDecision.mockResolvedValue({
        accepted: false,
      })
      identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue({
        adjustments: [],
      } as RemandResult)
      adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
      unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue(['NONE', []])
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
      return request(app)
        .get(`/${NOMS_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('data-qa="add-remand"')
          expect(res.text).toContain('Review remand')
        })
    })
    it('GET /{nomsId} with remand role unanswerd remand', () => {
      userInTest = userWithRemandRole
      identifyRemandPeriodsService.getRemandDecision.mockResolvedValue(null)
      identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue({
        adjustments: [],
      } as RemandResult)
      adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
      unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
        'NONE',
        [{ ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }],
      ])
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
      return request(app)
        .get(`/${NOMS_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Review remand')
          expect(res.text).not.toContain('data-qa="add-remand"')
        })
    })

    it('GET /{nomsId} with remand role uncalculable remand', () => {
      userInTest = userWithRemandRole
      identifyRemandPeriodsService.getRemandDecision.mockResolvedValue(null)
      identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(null)
      adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
      unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
        'NONE',
        [{ ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }],
      ])
      courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
      return request(app)
        .get(`/${NOMS_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).not.toContain('Review remand')
          expect(res.text).toContain('data-qa="add-remand"')
        })
    })
  })
  it('GET /{nomsId} - Pada things to do is displayed if there is prospective adas to review', () => {
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue(['UNKNOWN', []])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue({
      intercept: {
        type: 'FIRST_TIME',
        number: 5,
        anyProspective: true,
        messageArguments: [],
      },
    } as AdaAdjudicationDetails)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsProspectiveThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const adaTitle = $('h2:contains(Review ADA adjudications)').first()
        const adaMessage = $('p:contains(message)').first()
        const adaLink = $('a:contains(Review ADA)').first()
        const nav = $('nav')
        const adjustmentsLink = nav.find('a:contains(Adjustments)')
        expect(adjustmentsLink.find('span:contains(1)')).not.toBeUndefined()
        expect(adjustmentsLink.attr('aria-current')).toBe('page')
        expect(adaLink.attr('href')).toStrictEqual('http://localhost:8002/AB1234AB/additional-days/review-and-approve')
        expect(adaTitle.text()).toContain('Review ADA adjudications')
        expect(adaMessage.text()).toStrictEqual('message')
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
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
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
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
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
        expect(res.text).not.toContain('Review remand')
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
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
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
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [{ ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }, remandAdjustment, unusedDeductions],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).not.toContain('Review remand')
        expect(res.text).toContain('24')
        expect(res.text).toContainInOrder(['Last update', 'on 5 April 2023', 'by Leeds'])
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
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
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
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Some of the data in NOMIS related to this person is incorrect. This means unused deductions cannot be automatically calculated.',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of recall sentence with existing unused deductions inactive detleted', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'RECALL',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    adjustmentsService.findByPersonAndStatus.mockResolvedValue([
      {
        adjustmentType: 'UNUSED_DEDUCTIONS',
        effectiveDays: 10,
        lastUpdatedDate: '2024-01-01',
      } as Adjustment,
      {
        adjustmentType: 'UNUSED_DEDUCTIONS',
        effectiveDays: 11,
        lastUpdatedDate: '2023-01-01',
      } as Adjustment,
    ])
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'We have found 10 previous unused deductions that relate to the recall sentence. We cannot automatically calculate unused deductions, but you can <a data-qa="manual-unused-deductions" href="/ABC123/manual-unused-deductions/days/add">add any unused deductions here.</a>',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of recall sentence with no existing unused', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'RECALL',
      [remandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    adjustmentsService.findByPersonAndStatus.mockResolvedValue([])
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'We cannot automatically calculate unused deductions as there is a recall sentence, but you can <a data-qa="manual-unused-deductions" href="/ABC123/manual-unused-deductions/days/add">add any unused deductions here.</a>',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of recall sentence with existing dps unused', () => {
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'RECALL',
      [remandAdjustment, unusedDeductions],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'We cannot automatically calculate unused deductions as there is a recall sentence, but you can <a data-qa="manual-unused-deductions" href="/ABC123/manual-unused-deductions/days/edit">edit or delete the unused deductions here.</a>',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - with existing unused - Review unused deductions enabled', () => {
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
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `Unused deductions have not been calculated as there are unused deductions in NOMIS - <a data-qa="review-unused-deductions" href="/ABC123/review-deductions">review remand to calculate</a>`,
        )
      })
  })
  it('GET /{nomsId} unused deductions banner is suppressed if the user has the remand role and there are remand thingsToDo', () => {
    const nomisRemandAdjustment = { ...remandAdjustment }
    nomisRemandAdjustment.source = 'NOMIS'
    userInTest = userWithRemandRole

    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NOMIS_ADJUSTMENT',
      [nomisRemandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    paramStoreService.get.mockReturnValue(false)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsRemandThingsToDo)

    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain(
          `Unused deductions have not been calculated - <a data-qa="review-unused-deductions" href="/ABC123/review-deductions">review remand to calculate</a>`,
        )
        expect(res.text).not.toContain(
          '<div class="govuk-inset-text govuk-!-margin-left-4">\n          \n        </div>',
        )
        expect(res.text).toContain('There are periods of remand to review')
        expect(res.text).toContain(
          'This service has identified periods of remand that may be relevant. You must review these remand periods before calculating a release date.',
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because its a nomis adjustment - without existing unused - Review unused deductions enabled', () => {
    const nomisRemandAdjustment = { ...remandAdjustment }
    nomisRemandAdjustment.source = 'NOMIS'
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NOMIS_ADJUSTMENT',
      [nomisRemandAdjustment],
    ])
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    paramStoreService.get.mockReturnValue(false)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `Unused deductions have not been calculated - <a data-qa="review-unused-deductions" href="/ABC123/review-deductions">review remand to calculate</a>`,
        )
      })
  })
  it('GET /{nomsId} hub unused deductions cannot be calculated because of an exception', () => {
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
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

  it('GET /{nomsId} one LAL adjustment that affects the date should have the correct text displayed', () => {
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [{ ...lawfullyAtLargeAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }],
    ])
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('These days will affect the release dates')
      })
  })
  it('GET /{nomsId} one LAL adjustment that does not affects the date should have the correct text displayed', () => {
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    lawfullyAtLargeAdjustment.lawfullyAtLarge.affectsDates = 'NO'
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [{ ...lawfullyAtLargeAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }],
    ])
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('These additional days will not adjust the release dates')
      })
  })
  it('GET /{nomsId} one LAL adjustment with lawfullyAtLarge unset will display correctly', () => {
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    const nomisAdjustment = {
      id: '3',
      adjustmentType: 'LAWFULLY_AT_LARGE',
      toDate: '2023-09-05',
      fromDate: '2023-07-05',
      person: 'ABC123',
      bookingId: 12345,
      sentenceSequence: null,
      prisonId: 'LDS',
    } as Adjustment
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [{ ...nomisAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' }],
    ])
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).not.toContain('These days will affect the release dates')
        expect(res.text).not.toContain('These additional days will not adjust the release dates')
      })
  })
  it('GET /{nomsId} two LAL adjustments will not show anything', () => {
    courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue(serviceDefinitionsNoThingsToDo)
    adjustmentsService.getAdaAdjudicationDetails.mockResolvedValue(noInterceptAdjudication)
    const lal2 = lawfullyAtLargeAdjustment
    lal2.lawfullyAtLarge.affectsDates = 'NO'
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [
        { ...lawfullyAtLargeAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' },
        { ...lal2, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' },
      ],
    ])
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('These days will affect the release dates')
        expect(res.text).not.toContain('These additional days will not adjust the release dates')
      })
  })
})

import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import { Remand, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import './testutils/toContainInOrder'
import UnusedDeductionsService from '../services/unusedDeductionsService'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/additionalDaysAwardedService')
jest.mock('../services/unusedDeductionsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService() as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const unusedDeductionsService = new UnusedDeductionsService(null, null) as jest.Mocked<UnusedDeductionsService>
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
  days: 24,
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
} as Adjustment

const remandAdjustment = {
  id: '1',
  adjustmentType: 'REMAND',
  fromDate: '2023-04-05',
  toDate: '2023-06-05',
  person: 'ABC123',
  daysBetween: 24,
  effectiveDays: 14,
  bookingId: 12345,
  sentenceSequence: 1,
  prisonId: 'LDS',
} as Adjustment

const unusedDeductions = {
  id: '1',
  adjustmentType: 'UNUSED_DEDUCTIONS',
  toDate: null,
  fromDate: '2023-04-05',
  person: 'ABC123',
  days: 10,
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
} as Adjustment

const adaAdjustment = {
  id: '1',
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  toDate: null,
  fromDate: '2023-04-05',
  person: 'ABC123',
  days: 24,
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
} as Adjustment

let app: Express

const defaultUser = user
const userWithRemandRole = { ...user, roles: ['REMAND_IDENTIFIER'] }

let userInTest = defaultUser

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      identifyRemandPeriodsService,
      adjustmentsStoreService,
      additionalDaysAwardedService,
      unusedDeductionsService,
    },
    userSupplier: () => userInTest,
  })
})

afterEach(() => {
  userInTest = defaultUser
  jest.resetAllMocks()
})

describe('Adjustment routes tests', () => {
  it('GET /{nomsId} hub', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    adjustmentsService.findByPerson.mockResolvedValue([
      { ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' },
      remandAdjustment,
      unusedDeductions,
    ])
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    unusedDeductionsService.serviceHasCalculatedUnusedDeductions.mockResolvedValue(false)
    additionalDaysAwardedService.shouldIntercept.mockResolvedValue({
      type: 'NONE',
      number: 0,
      anyProspective: false,
    })
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).not.toContain('Nobody may have 20 days remand')
        expect(res.text).toContain('24')
        expect(res.text).toContain('Unused deductions time cannot be calculated')
        expect(res.text).toContain(
          'Governors can restore some of the Added days awarded (ADA) time for a prisoner. These are known as RADAs (Restoration of Added Days Awarded)',
        )
        expect(res.text).toContain('Last update\n          on 05 April 2023\n          by Leeds')
        expect(res.text).toContainInOrder([
          'Unused deductions',
          'Total deductions',
          '24',
          'Unused deductions',
          '10',
          'Effective deductions',
          '14',
        ])
      })
  })
  it('GET /{nomsId} with remand role', () => {
    userInTest = userWithRemandRole
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([
      { ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' },
    ])
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    additionalDaysAwardedService.shouldIntercept.mockResolvedValue({ type: 'NONE', number: 0, anyProspective: false })
    unusedDeductionsService.serviceHasCalculatedUnusedDeductions.mockResolvedValue(true)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Nobody may have 20 days remand')
      })
  })
  it('GET /{nomsId} is intercepted if there is adas to review', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    adjustmentsService.findByPerson.mockResolvedValue([
      { ...radaAdjustment, prisonName: 'Leeds', lastUpdatedDate: '2023-04-05' },
    ])
    additionalDaysAwardedService.shouldIntercept.mockResolvedValue({
      type: 'FIRST_TIME',
      number: 5,
      anyProspective: true,
    })
    return request(app).get(`/${NOMS_ID}`).expect(302).expect('Location', `/${NOMS_ID}/additional-days/intercept`)
  })

  it('GET /{nomsId} relevant remand throws error', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([radaAdjustment])
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    identifyRemandPeriodsService.calculateRelevantRemand.mockRejectedValue(remandResult)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Nobody may have 20 days remand')
      })
  })

  it('GET /{nomsId}/restored-additional-days/add', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([adaAdjustment])
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    return request(app)
      .get(`/${NOMS_ID}/restored-additional-days/add`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Number of additional days restored')
        expect(res.text).toContain('Continue')
      })
  })

  it('GET /{nomsId}/restored-additional-days/add with validation error redirect', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([])
    return request(app).get(`/${NOMS_ID}/restored-additional-days/add`).redirects(1)
  })

  it('POST /{nomsId}/restored-additional-days/add valid', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 24 })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/review`)
      .expect(res => {
        expect(adjustmentsStoreService.storeOnly.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.storeOnly.mock.calls[0][2]).toStrictEqual({ ...radaAdjustment, id: undefined })
      })
  })
  it('POST /{nomsId}/restored-additional-days/add empty form validation', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The number of days restored must be entered.')
        expect(res.text).toContain('This date must include a valid day, month and year.')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add missing day and month validation and not number days', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-year': '2023', days: 'xyz' })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter a valid number of additional days restored.')
        expect(res.text).toContain('This date must include a day and month.')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add invalid date and negative days', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '36', 'from-month': '13', 'from-year': '2023', days: -1 })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter a valid number of additional days restored.')
        expect(res.text).toContain('This date does not exist.')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add 2 digit year', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '6', 'from-month': '3', 'from-year': '23', days: -1 })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Year must include 4 numbers')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add invalid date 29 Feb', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '29', 'from-month': '02', 'from-year': '2023', days: 1 })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This date does not exist.')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add zero days', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 0 })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter a valid number of additional days restored.')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add fraction days', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 1.5 })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter a valid number of additional days restored.')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add server side validation mesage', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.validate.mockResolvedValue([
      {
        code: 'MORE_RADAS_THAN_ADAS',
        arguments: [],
        message: 'The number of days restored cannot be more than the number of days rewarded.',
        type: 'VALIDATION',
      },
    ])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 24 })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The number of days restored cannot be more than the number of days rewarded.')
      })
  })
  it('POST /{nomsId}/restored-additional-days/add server side warning mesage', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.validate.mockResolvedValue([
      {
        code: 'RADA_REDUCES_BY_MORE_THAN_HALF',
        arguments: [],
        message: 'Are you sure, as this reduction is more than 50% of the total additional days awarded?',
        type: 'WARNING',
      },
    ])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 24 })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/warning`)
      .expect(res => {
        expect(adjustmentsStoreService.storeOnly.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.storeOnly.mock.calls[0][2]).toStrictEqual({ ...radaAdjustment, id: undefined })
      })
  })

  it('GET /{nomsId}/restored-additional-days/edit should load adjustment from session', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([adaAdjustment])
    adjustmentsStoreService.getOnly.mockReturnValue(radaAdjustment)
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    return request(app)
      .get(`/${NOMS_ID}/restored-additional-days/edit`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('value="5"')
        expect(res.text).toContain('value="4"')
        expect(res.text).toContain('value="2023"')
        expect(res.text).toContain('value="24"')
      })
  })

  it('GET /{nomsId}/restored-additional-days/edit should load adjustment from server', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([adaAdjustment])
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    adjustmentsService.get.mockResolvedValue(radaAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/restored-additional-days/edit/this-is-an-id`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('value="5"')
        expect(res.text).toContain('value="4"')
        expect(res.text).toContain('value="2023"')
        expect(res.text).toContain('value="24"')
      })
  })

  it('POST /{nomsId}/restored-additional-days/edit valid', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/edit`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 24 })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/review`)
      .expect(res => {
        expect(adjustmentsStoreService.storeOnly.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.storeOnly.mock.calls[0][2]).toStrictEqual({ ...radaAdjustment, id: undefined })
      })
  })
  it('POST /{nomsId}/restored-additional-days/edit/{id} valid', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/edit/this-is-an-id`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 24 })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/review`)
      .expect(res => {
        expect(adjustmentsStoreService.storeOnly.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.storeOnly.mock.calls[0][2]).toStrictEqual({
          ...radaAdjustment,
          id: 'this-is-an-id',
        })
      })
  })
  it('GET /{nomsId}/warning display server side warning', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getOnly.mockReturnValue(radaAdjustment)
    adjustmentsService.validate.mockResolvedValue([
      {
        code: 'RADA_REDUCES_BY_MORE_THAN_HALF',
        arguments: [],
        message: 'Are you sure, as this reduction is more than 50% of the total additional days awarded?',
        type: 'WARNING',
      },
    ])
    return request(app)
      .get(`/${NOMS_ID}/warning`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Are you sure, as this reduction is more than 50% of the total additional days awarded?',
        )
      })
  })

  it('POST /{nomsId}/warning submit warning agreement', () => {
    adjustmentsStoreService.getOnly.mockReturnValue({ ...radaAdjustment, id: undefined })
    return request(app)
      .post(`/${NOMS_ID}/warning`)
      .send({ confirm: 'yes' })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/review`)
  })

  it('POST /{nomsId}/warning submit warning disagreement', () => {
    adjustmentsStoreService.getOnly.mockReturnValue({ ...radaAdjustment, id: undefined })
    return request(app)
      .post(`/${NOMS_ID}/warning`)
      .send({ confirm: 'no' })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/restored-additional-days/edit`)
  })
  it('POST /{nomsId}/warning submit warning without an answer', () => {
    adjustmentsStoreService.getOnly.mockReturnValue({ ...radaAdjustment, id: undefined })
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getOnly.mockReturnValue(radaAdjustment)
    adjustmentsService.validate.mockResolvedValue([
      {
        code: 'RADA_REDUCES_BY_MORE_THAN_HALF',
        arguments: [],
        message: 'Are you sure, as this reduction is more than 50% of the total additional days awarded?',
        type: 'WARNING',
      },
    ])
    return request(app)
      .post(`/${NOMS_ID}/warning`)
      .send({})
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select an answer')
      })
  })

  it('GET /{nomsId}/review', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getOnly.mockReturnValue(radaAdjustment)

    return request(app)
      .get(`/${NOMS_ID}/review`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Date the days were restored')
        expect(res.text).toContain('5 Apr 2023')
        expect(res.text).toContain('Number of days restored')
        expect(res.text).toContain('24')
        expect(res.text).toContain('Submit')
        expect(res.text).toContain(`/${NOMS_ID}/restored-additional-days/edit`)
      })
  })

  it('POST /{nomsId}/review', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getOnly.mockReturnValue({ ...radaAdjustment, id: undefined })
    adjustmentsService.create.mockResolvedValue({ adjustmentIds: ['this-is-an-id'] })
    adjustmentsService.get.mockResolvedValue({ ...radaAdjustment, id: 'this-is-an-id' })
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=${encodeURI(
          '{"type":"RESTORATION_OF_ADDITIONAL_DAYS_AWARDED","days":24,"action":"CREATE"}',
        )}`,
      )
      .expect(res => {
        expect(adjustmentsService.create.mock.calls).toHaveLength(1)
        expect(adjustmentsService.create.mock.calls[0][0]).toStrictEqual([{ ...radaAdjustment, id: undefined }])
      })
  })
  it('POST /{nomsId}/review with a adjustment with an id', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getOnly.mockReturnValue({ ...radaAdjustment, id: 'this-is-an-id' })
    adjustmentsService.get.mockResolvedValue({ ...radaAdjustment, id: 'this-is-an-id' })
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=${encodeURI(
          '{"type":"RESTORATION_OF_ADDITIONAL_DAYS_AWARDED","days":24,"action":"UPDATE"}',
        )}`,
      )
      .expect(res => {
        expect(adjustmentsService.update.mock.calls).toHaveLength(1)
        expect(adjustmentsService.update.mock.calls[0][0]).toStrictEqual('this-is-an-id')
        expect(adjustmentsService.update.mock.calls[0][1]).toStrictEqual({ ...radaAdjustment, id: 'this-is-an-id' })
      })
  })

  it('GET /{nomsId}/{adjustmentType}/view', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([
      { ...radaAdjustment, id: 'this-is-an-id', lastUpdatedBy: 'Doris McNealy', status: 'ACTIVE', prisonName: 'Leeds' },
    ])

    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
    })
    return request(app)
      .get(`/${NOMS_ID}/restored-additional-days/view`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Leeds')
        expect(res.text).toContain('edit/this-is-an-id')
        expect(res.text).toContain('remove/this-is-an-id')
        expect(res.text).toContain('Total days')
      })
  })

  it('GET /{nomsId}/{adjustmentType}/remove/{id}', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.get.mockResolvedValue(radaAdjustment)

    return request(app)
      .get(`/${NOMS_ID}/restored-additional-days/remove/this-is-an-id`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('5 Apr 2023')
        expect(res.text).toContain('22')
        expect(res.text).toContain('This will remove this record.')
      })
  })

  it('POST /{nomsId}/{adjustmentType}/remove/{id}', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.get.mockResolvedValue(radaAdjustment)

    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/remove/this-is-an-id`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=${encodeURI(
          '{"type":"RESTORATION_OF_ADDITIONAL_DAYS_AWARDED","days":24,"action":"REMOVE"}',
        )}`,
      )
      .expect(res => {
        expect(adjustmentsService.delete.mock.calls).toHaveLength(1)
        expect(adjustmentsService.delete.mock.calls[0][0]).toStrictEqual('this-is-an-id')
      })
  })
})

import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import { Remand, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService() as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>

const NOMS_ID = 'ABC123'

const stubbedPrisonerData = {
  offenderNo: NOMS_ID,
  firstName: 'Anon',
  lastName: 'Nobody',
  dateOfBirth: '24/06/2000',
  bookingId: 12345,
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
  adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
  toDate: null,
  fromDate: '2023-04-05',
  person: 'ABC123',
  days: 24,
  bookingId: 12345,
  sentenceSequence: null,
} as AdjustmentDetails

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: { prisonerService, adjustmentsService, identifyRemandPeriodsService, adjustmentsStoreService },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Adjustment routes tests', () => {
  it('GET /{nomsId}', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsService.findByPerson.mockResolvedValue([{ id: '1', adjustment: radaAdjustment }])
    identifyRemandPeriodsService.calculateRelevantRemand.mockResolvedValue(remandResult)
    return request(app)
      .get(`/${NOMS_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Nobody may have 20 days remand')
        expect(res.text).toContain('24')
      })
  })

  it('GET /{nomsId}/restored-additional-days/add', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .get(`/${NOMS_ID}/restored-additional-days/add`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Date of days restored')
        expect(res.text).toContain('Continue')
      })
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
        expect(adjustmentsStoreService.store.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.store.mock.calls[0][2]).toStrictEqual(radaAdjustment)
      })
  })
  it('POST /{nomsId}/restored-additional-days/add empty form validation', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You must enter days')
        expect(res.text).toContain('The date entered must include a valid day, month and a year.')
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
        expect(res.text).toContain('You must enter days')
        expect(res.text).toContain('The date entered must include a day and month.')
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
        expect(res.text).toContain('You must enter days')
        expect(res.text).toContain('The date entered must include a valid day, month and a year.')
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
        expect(adjustmentsStoreService.store.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.store.mock.calls[0][2]).toStrictEqual(radaAdjustment)
      })
  })

  it('GET /{nomsId}/warning display server side warning', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.get.mockReturnValue(radaAdjustment)
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
    return request(app)
      .post(`/${NOMS_ID}/warning`)
      .send({ confirm: 'yes' })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/review`)
  })

  it('POST /{nomsId}/warning submit warning disagreement', () => {
    return request(app)
      .post(`/${NOMS_ID}/warning`)
      .send({ confirm: 'no' })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}`)
  })
  it('POST /{nomsId}/warning submit warning without an answer', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.get.mockReturnValue(radaAdjustment)
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
        expect(res.text).toContain('Pick an answer')
      })
  })

  it('GET /{nomsId}/review', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.get.mockReturnValue(radaAdjustment)

    return request(app)
      .get(`/${NOMS_ID}/review`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Adjustment type')
        expect(res.text).toContain('Restore additional days awarded (RADA)')
        expect(res.text).toContain('Date of days restored')
        expect(res.text).toContain('05 April 2023')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('24')
        expect(res.text).toContain('Accept and save')
      })
  })

  it('POST /{nomsId}/review', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.get.mockReturnValue(radaAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=${encodeURI('{"type":"RESTORATION_OF_ADDITIONAL_DAYS_AWARDED","days":24}')}`,
      )
      .expect(res => {
        expect(adjustmentsService.create.mock.calls).toHaveLength(1)
        expect(adjustmentsService.create.mock.calls[0][0]).toStrictEqual(radaAdjustment)
      })
  })
})

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

  it('POST /{nomsId}/restored-additional-days/add', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
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

  it('GET /{nomsId}/review', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.get.mockReturnValue([radaAdjustment])

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
    adjustmentsStoreService.get.mockReturnValue([radaAdjustment])
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}`)
      .expect(res => {
        expect(adjustmentsService.create.mock.calls).toHaveLength(1)
        expect(adjustmentsService.create.mock.calls[0][0]).toStrictEqual(radaAdjustment)
      })
  })
})

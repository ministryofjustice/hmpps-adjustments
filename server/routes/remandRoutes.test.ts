import dayjs from 'dayjs'
import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import './testutils/toContainInOrder'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/additionalDaysAwardedService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService() as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const additionalDaysAwardedService = new AdditionalDaysAwardedService(
  null,
  null,
) as jest.Mocked<AdditionalDaysAwardedService>

const NOMS_ID = 'ABC123'

const SESSION_ID = '123-abc'

const stubbedPrisonerData = {
  offenderNo: NOMS_ID,
  firstName: 'Anon',
  lastName: 'Nobody',
  dateOfBirth: '24/06/2000',
  bookingId: 12345,
  agencyId: 'LDS',
} as PrisonApiPrisoner

const stubbedSentencesAndOffences = [
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 1,
    sentenceStatus: 'A',
    offences: [
      { offenceDescription: 'Doing a crime', offenceStartDate: '2021-01-04', offenceEndDate: '2021-01-05' },
      { offenceDescription: 'Doing a different crime', offenceStartDate: '2021-03-06' },
    ],
  } as PrisonApiOffenderSentenceAndOffences,
]

const blankAdjustment = {
  person: NOMS_ID,
  bookingId: stubbedPrisonerData.bookingId,
} as Adjustment

const adjustmentWithDates = {
  ...blankAdjustment,
  fromDate: '2023-01-01',
  toDate: '2023-01-10',
} as Adjustment

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      identifyRemandPeriodsService,
      adjustmentsStoreService,
      additionalDaysAwardedService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Adjustment routes tests', () => {
  it('GET /{nomsId}/remand/add', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.store.mockReturnValue(SESSION_ID)
    return request(app)
      .get(`/${NOMS_ID}/remand/add`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
  })

  it('GET /{nomsId}/remand/dates/add', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Remand start date')
        expect(res.text).toContain('Remand end date')
        expect(res.text).toContain('Continue')
      })
  })

  it('POST /{nomsId}/remand/dates/add valid', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
      .send({
        'from-day': '5',
        'from-month': '4',
        'from-year': '2023',
        'to-day': '20',
        'to-month': '4',
        'to-year': '2023',
      })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/remand/offences/add/${SESSION_ID}`)
  })

  it('POST /{nomsId}/remand/dates/add empty form validation', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('This date must include a valid day, month and year')
      })
  })

  it('POST /{nomsId}/remand/dates/add to date after from', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
      .send({
        'from-day': '5',
        'from-month': '4',
        'from-year': '2023',
        'to-day': '20',
        'to-month': '3',
        'to-year': '2023',
      })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The first day of remand must be before the last day of remand.')
      })
  })

  it('POST /{nomsId}/remand/dates/add dates in future', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
      .send({
        'from-day': '5',
        'from-month': '4',
        'from-year': (dayjs().year() + 1).toString(),
        'to-day': '20',
        'to-month': '4',
        'to-year': (dayjs().year() + 1).toString(),
      })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The first day of remand must not be in the future.')
        expect(res.text).toContain('The last day of remand must not be in the future.')
      })
  })

  it('GET /{nomsId}/remand/offences/add', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDates)
    return request(app)
      .get(`/${NOMS_ID}/remand/offences/add/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContainInOrder(['10', 'day(s)'])
        expect(res.text).toContainInOrder([
          'Court 1',
          'CASE001',
          'Doing a crime',
          'Committed from 04 January 2021 to 05 January 2021',
          'Doing a different crime',
          'Committed on 06 March 2021',
        ])
      })
  })

  it('POST /{nomsId}/remand/offence/add valid', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDates)
    return request(app)
      .post(`/${NOMS_ID}/remand/offences/add/${SESSION_ID}`)
      .send({
        chargeId: ['5', '6', '7'],
      })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/remand/review`)
  })

  it('POST /{nomsId}/remand/offence/add no offences selected', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDates)
    return request(app)
      .post(`/${NOMS_ID}/remand/offences/add/${SESSION_ID}`)
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select an offence')
      })
  })
})

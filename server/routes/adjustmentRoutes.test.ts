import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdditionalDaysAwardedBackendService from '../services/additionalDaysAwardedBackendService'
import './testutils/toContainInOrder'
import UnusedDeductionsService from '../services/unusedDeductionsService'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/additionalDaysAwardedBackendService')
jest.mock('../services/unusedDeductionsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const unusedDeductionsService = new UnusedDeductionsService(null, null, null) as jest.Mocked<UnusedDeductionsService>
const additionalDaysAwardedBackendService = new AdditionalDaysAwardedBackendService(
  null,
  null,
) as jest.Mocked<AdditionalDaysAwardedBackendService>

const NOMS_ID = 'ABC123'

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

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      identifyRemandPeriodsService,
      adjustmentsStoreService,
      additionalDaysAwardedBackendService,
      unusedDeductionsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Adjustment routes tests', () => {
  it('GET /{nomsId}/restored-additional-days/add', () => {
    adjustmentsService.findByPerson.mockResolvedValue([adaAdjustment])
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
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
    adjustmentsService.findByPerson.mockResolvedValue([])
    return request(app).get(`/${NOMS_ID}/restored-additional-days/add`).redirects(1)
  })

  it('POST /{nomsId}/restored-additional-days/add valid', () => {
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 24 })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/review`)
      .expect(res => {
        expect(adjustmentsStoreService.storeOnly.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.storeOnly.mock.calls[0][2]).toStrictEqual({
          ...radaAdjustment,
          id: undefined,
        })
      })
  })
  it('POST /{nomsId}/restored-additional-days/add empty form validation', () => {
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/add`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The number of additional days restored must be entered.')
        expect(res.text).toContain('This date must include a valid day, month and year.')
      })
  })

  it('POST /{nomsId}/restored-additional-days/add missing day and month validation and not number days', () => {
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
        expect(adjustmentsStoreService.storeOnly.mock.calls[0][2]).toStrictEqual({
          ...radaAdjustment,
          id: undefined,
        })
      })
  })

  it('GET /{nomsId}/restored-additional-days/edit should load adjustment from session', () => {
    adjustmentsService.findByPerson.mockResolvedValue([adaAdjustment])
    adjustmentsStoreService.getOnly.mockReturnValue(radaAdjustment)
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
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
    adjustmentsService.findByPerson.mockResolvedValue([adaAdjustment])
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
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
    adjustmentsService.validate.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/edit`)
      .send({ 'from-day': '5', 'from-month': '4', 'from-year': '2023', days: 24 })
      .type('form')
      .expect(302)
      .expect('Location', `/${NOMS_ID}/review`)
      .expect(res => {
        expect(adjustmentsStoreService.storeOnly.mock.calls).toHaveLength(1)
        expect(adjustmentsStoreService.storeOnly.mock.calls[0][2]).toStrictEqual({
          ...radaAdjustment,
          id: undefined,
        })
      })
  })
  it('POST /{nomsId}/restored-additional-days/edit/{id} valid', () => {
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
    adjustmentsStoreService.getOnly.mockReturnValue(radaAdjustment)

    return request(app)
      .get(`/${NOMS_ID}/review`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Date of days restored')
        expect(res.text).toContain('5 Apr 2023')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('24')
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain(`/${NOMS_ID}/restored-additional-days/edit`)
      })
  })

  it('POST /{nomsId}/review', () => {
    adjustmentsStoreService.getOnly.mockReturnValue({ ...radaAdjustment, id: undefined })
    adjustmentsService.create.mockResolvedValue({ adjustmentIds: ['this-is-an-id'] })
    adjustmentsService.get.mockResolvedValue({ ...radaAdjustment, id: 'this-is-an-id' })
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22RESTORATION_OF_ADDITIONAL_DAYS_AWARDED%22,%22days%22:24,%22action%22:%22CREATE%22%7D`,
      )
      .expect(res => {
        expect(adjustmentsService.create.mock.calls).toHaveLength(1)
        expect(adjustmentsService.create.mock.calls[0][0]).toStrictEqual([{ ...radaAdjustment, id: undefined }])
      })
  })
  it('POST /{nomsId}/review with a adjustment with an id', () => {
    adjustmentsStoreService.getOnly.mockReturnValue({ ...radaAdjustment, id: 'this-is-an-id' })
    adjustmentsService.get.mockResolvedValue({ ...radaAdjustment, id: 'this-is-an-id' })
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22RESTORATION_OF_ADDITIONAL_DAYS_AWARDED%22,%22days%22:24,%22action%22:%22UPDATE%22%7D`,
      )
      .expect(res => {
        expect(adjustmentsService.update.mock.calls).toHaveLength(1)
        expect(adjustmentsService.update.mock.calls[0][0]).toStrictEqual('this-is-an-id')
        expect(adjustmentsService.update.mock.calls[0][1]).toStrictEqual({
          ...radaAdjustment,
          id: 'this-is-an-id',
        })
      })
  })

  it('GET /{nomsId}/{adjustmentType}/view', () => {
    adjustmentsService.findByPerson.mockResolvedValue([
      { ...radaAdjustment, id: 'this-is-an-id', lastUpdatedBy: 'Doris McNealy', status: 'ACTIVE', prisonName: 'Leeds' },
    ])

    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestExcludingRecalls: new Date(),
      earliestSentence: new Date(),
      sentencesAndOffences: [],
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
    adjustmentsService.get.mockResolvedValue(radaAdjustment)

    return request(app)
      .get(`/${NOMS_ID}/restored-additional-days/remove/this-is-an-id`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('5 Apr 2023')
        expect(res.text).toContain('22')
      })
  })

  it('POST /{nomsId}/{adjustmentType}/remove/{id}', () => {
    adjustmentsService.get.mockResolvedValue(radaAdjustment)

    return request(app)
      .post(`/${NOMS_ID}/restored-additional-days/remove/this-is-an-id`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22RESTORATION_OF_ADDITIONAL_DAYS_AWARDED%22,%22days%22:24,%22action%22:%22REMOVE%22%7D`,
      )
      .expect(res => {
        expect(adjustmentsService.delete.mock.calls).toHaveLength(1)
        expect(adjustmentsService.delete.mock.calls[0][0]).toStrictEqual('this-is-an-id')
      })
  })
})

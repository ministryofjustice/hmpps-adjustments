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
import ParamStoreService from '../services/paramStoreService'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/additionalDaysAwardedBackendService')
jest.mock('../services/unusedDeductionsService')
jest.mock('../services/paramStoreService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const unusedDeductionsService = new UnusedDeductionsService(null, null) as jest.Mocked<UnusedDeductionsService>
const additionalDaysAwardedBackendService = new AdditionalDaysAwardedBackendService(
  null,
  null,
) as jest.Mocked<AdditionalDaysAwardedBackendService>
const paramStoreService = new ParamStoreService() as jest.Mocked<ParamStoreService>

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

const unlawfullyAtLargeAdjustment = {
  id: '2',
  adjustmentType: 'UNLAWFULLY_AT_LARGE',
  toDate: '2023-07-25',
  fromDate: '2023-06-05',
  unlawfullyAtLarge: { type: 'RECALL' },
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
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

const sentenceAndOffenceBaseRecord = {
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
  sentenceDate: '2023-05-06',
  offences: [
    {
      offenderChargeId: 1,
      offenceDescription: 'Doing a crime',
      offenceStartDate: '2021-01-04',
      offenceEndDate: '2021-01-05',
    },
    { offenderChargeId: 2, offenceDescription: 'Doing a different crime', offenceStartDate: '2021-03-06' },
  ],
} as PrisonApiOffenderSentenceAndOffences

const stubbedSentencesAndOffences = [sentenceAndOffenceBaseRecord]

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
      paramStoreService,
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

  it('GET /{nomsId}/review RADA', () => {
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

  it('GET /{nomsId}/review UAL', () => {
    adjustmentsStoreService.getOnly.mockReturnValue(unlawfullyAtLargeAdjustment)

    return request(app)
      .get(`/${NOMS_ID}/review`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('First day spent UAL')
        expect(res.text).toContain('Last day spent UAL')
        expect(res.text).toContain('5 Jun 2023')
        expect(res.text).toContain('25 Jul 2023')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('51')
        expect(res.text).toContain('Type of UAL')
        expect(res.text).toContain('Recall')
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain(`/${NOMS_ID}/unlawfully-at-large/edit`)
      })
  })

  it('GET /{nomsId}/review LAL', () => {
    adjustmentsStoreService.getOnly.mockReturnValue(lawfullyAtLargeAdjustment)

    return request(app)
      .get(`/${NOMS_ID}/review`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('First day spent LAL')
        expect(res.text).toContain('Last day spent LAL')
        expect(res.text).toContain('5 Jul 2023')
        expect(res.text).toContain('5 Sep 2023')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('61')
        expect(res.text).toContain('Delay release dates')
        expect(res.text).toContain('Yes')
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain(`/${NOMS_ID}/lawfully-at-large/edit`)
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
  it('POST /{nomsId}/review with a rada adjustment with an id', () => {
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

  it('POST /{nomsId}/review with a UAL adjustment with an id', () => {
    adjustmentsStoreService.getOnly.mockReturnValue({ ...unlawfullyAtLargeAdjustment, id: 'this-is-an-id' })
    adjustmentsService.get.mockResolvedValue({ ...lawfullyAtLargeAdjustment, id: 'this-is-an-id' })
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22UNLAWFULLY_AT_LARGE%22,%22days%22:51,%22action%22:%22UPDATE%22%7D`,
      )
      .expect(res => {
        expect(adjustmentsService.update.mock.calls).toHaveLength(1)
        expect(adjustmentsService.update.mock.calls[0][0]).toStrictEqual('this-is-an-id')
        expect(adjustmentsService.update.mock.calls[0][1]).toStrictEqual({
          ...unlawfullyAtLargeAdjustment,
          id: 'this-is-an-id',
        })
      })
  })

  it('POST /{nomsId}/review with a LAL adjustment with an id', () => {
    adjustmentsStoreService.getOnly.mockReturnValue({ ...lawfullyAtLargeAdjustment, id: 'this-is-an-id' })
    adjustmentsService.get.mockResolvedValue({ ...lawfullyAtLargeAdjustment, id: 'this-is-an-id' })
    return request(app)
      .post(`/${NOMS_ID}/review`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22LAWFULLY_AT_LARGE%22,%22days%22:63,%22action%22:%22UPDATE%22%7D`,
      )
      .expect(res => {
        expect(adjustmentsService.update.mock.calls).toHaveLength(1)
        expect(adjustmentsService.update.mock.calls[0][0]).toStrictEqual('this-is-an-id')
        expect(adjustmentsService.update.mock.calls[0][1]).toStrictEqual({
          ...lawfullyAtLargeAdjustment,
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
    paramStoreService.get.mockReturnValue(false)
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

  it('GET /{nomsId}/unlawfully-at-large/add', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[85] = unlawfullyAtLargeAdjustment
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(unlawfullyAtLargeAdjustment)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get(`/${NOMS_ID}/unlawfully-at-large/add`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Enter UAL details')
        expect(res.text).toContain(`The rules for UAL (Unlawfully at large) can be found in
    <a href="https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1083190/sc-annex-a-operational-guidance.pdf#page=87"
       class="govuk-link" rel="noreferrer noopener"
       target="_blank">the policy framework</a>.`)
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/unlawfully-at-large/addOrEdit fromDate before earliest sentence date', async ({ addOrEdit }) => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[85] = unlawfullyAtLargeAdjustment
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(unlawfullyAtLargeAdjustment)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .post(`/${NOMS_ID}/unlawfully-at-large/${addOrEdit}/85`)
      .send({
        'from-day': '5',
        'from-month': '3',
        'from-year': '2000',
        'to-day': '20',
        'to-month': '3',
        'to-year': '2023',
        type: 'IMMIGRATION_DETENTION',
      })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The unlawfully at large period cannot start before the earliest sentence date, on 06 May 2023',
        )
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/unlawfully-at-large/addOrEdit No UAL type selected', async ({ addOrEdit }) => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[85] = unlawfullyAtLargeAdjustment
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(unlawfullyAtLargeAdjustment)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .post(`/${NOMS_ID}/unlawfully-at-large/${addOrEdit}/85`)
      .send({
        'from-day': '10',
        'from-month': '5',
        'from-year': '2023',
        'to-day': '20',
        'to-month': '6',
        'to-year': '2023',
      })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You must select the type of unlawfully at large')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/unlawfully-at-large/addOrEdit toDate in the future', async ({ addOrEdit }) => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[85] = unlawfullyAtLargeAdjustment
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(unlawfullyAtLargeAdjustment)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .post(`/${NOMS_ID}/unlawfully-at-large/${addOrEdit}/85`)
      .send({
        'from-day': '5',
        'from-month': '3',
        'from-year': '2900',
        'to-day': '20',
        'to-month': '3',
        'to-year': '2900',
        type: 'IMMIGRATION_DETENTION',
      })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The first day of unlawfully at large date must not be in the future')
        expect(res.text).toContain('The last day of unlawfully at large date must not be in the future')
      })
  })

  it('GET /{nomsId}/lawfully-at-large/add Check supporting info is correctly displayed', () => {
    return request(app)
      .get(`/${NOMS_ID}/lawfully-at-large/add`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Enter LAL details')
        expect(res.text).toContain(
          `For example, a non-custodial sentence is upgraded at the Court of Appeal to a custodial sentence on appeal. The time lawfully at large between the original sentence and when the sentence is upgraded or amended would delay the release dates.`,
        )
        expect(res.text).toContain(
          `For example, a prisoner is lawfully released on licence. The sentence is increased on appeal. The time spent on licence will count as time served towards the sentence`,
        )
        expect(res.text).toContain(
          `Email <a href="mailto:omu.specialistsupportteam@justice.gov.uk">
            omu.specialistsupportteam@justice.gov.uk</a> if you are unsure whether the LAL days
        will delay this person's release dates.`,
        )
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/unlawfully-at-large/addOrEdit Check empty fields have the correct warnings',
    async ({ addOrEdit }) => {
      prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
      return request(app)
        .post(`/${NOMS_ID}/lawfully-at-large/${addOrEdit}`)
        .send()
        .type('form')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('This date must include a valid day, month and year.')
          expect(res.text).toContain('You must select if the LAL will delay this person&#39;s release dates')
        })
    },
  )

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/lawfully-at-large/addOrEdit toDate in the future', async ({ addOrEdit }) => {
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .post(`/${NOMS_ID}/lawfully-at-large/${addOrEdit}/58`)
      .send({
        'from-day': '5',
        'from-month': '3',
        'from-year': '2900',
        'to-day': '20',
        'to-month': '3',
        'to-year': '2900',
        affectedDates: 'YES',
      })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The first day of lawfully at large date must not be in the future')
        expect(res.text).toContain('The last day of lawfully at large date must not be in the future')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/lawfully-at-large/addOrEdit fromDate before earliest sentence date', async ({ addOrEdit }) => {
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .post(`/${NOMS_ID}/lawfully-at-large/${addOrEdit}/85`)
      .send({
        'from-day': '5',
        'from-month': '3',
        'from-year': '2000',
        'to-day': '20',
        'to-month': '3',
        'to-year': '2023',
        affectedDates: 'YES',
      })
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'The lawfully at large period cannot start before the earliest sentence date, on 06 May 2023',
        )
      })
  })
})

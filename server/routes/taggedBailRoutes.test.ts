import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import './testutils/toContainInOrder'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import SessionAdjustment from '../@types/AdjustmentTypes'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/adjustmentsStoreService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService() as jest.Mocked<AdjustmentsService>
const calculateReleaseDatesService = new CalculateReleaseDatesService() as jest.Mocked<CalculateReleaseDatesService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>

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

const sentenceAndOffenceBaseRecord = {
  terms: [
    {
      years: 3,
    },
  ],
  sentenceTypeDescription: 'SDS Standard Sentence',
  sentenceDate: '2021-08-20',
  caseSequence: 1,
  lineSequence: 1,
  caseReference: 'CASE001',
  courtDescription: 'Court 1',
  sentenceSequence: 1,
  sentenceStatus: 'A',
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

const stubbedSentencesAndOffences = [
  sentenceAndOffenceBaseRecord,
  { ...sentenceAndOffenceBaseRecord, sentenceDate: '2021-08-19', courtDescription: 'Court 2' },
  {
    ...sentenceAndOffenceBaseRecord,
    caseSequence: 2,
    caseReference: 'CASE002',
    sentenceDate: '2021-08-30',
    courtDescription: 'Court 3',
  },
]

const blankAdjustment = {
  person: NOMS_ID,
  bookingId: stubbedPrisonerData.bookingId,
  adjustmentType: 'TAGGED_BAIL',
} as SessionAdjustment

const populatedAdjustment = {
  ...blankAdjustment,
  days: 9955,
  taggedBail: { caseSequence: 1 },
}

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      adjustmentsStoreService,
      calculateReleaseDatesService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Tagged bail routes tests', () => {
  it('GET /{nomsId}/tagged-bail/add redirects correctly', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.store.mockReturnValue(SESSION_ID)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get(`/${NOMS_ID}/tagged-bail/add`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/tagged-bail/select-case/add/${SESSION_ID}`)
  })

  it('GET /{nomsId}/tagged-bail/select-case/add shows correct information', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get(`/${NOMS_ID}/tagged-bail/select-case/add/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Court 2')
        expect(res.text).toContain('Court 3')
        expect(res.text).not.toContain('Court 1')
      })
  })

  it('GET /{nomsId}/tagged-bail/days/add shows correct information', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/tagged-bail/days/add/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Enter the amount of tagged bail')
      })
  })

  it('GET /{nomsId}/tagged-bail/review/add shows correct information', () => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsStoreService.getById.mockReturnValue(populatedAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/tagged-bail/review/add/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Tagged bail details')
        expect(res.text).toContain('Court 2<br>CASE001 19 Aug 2021')
        expect(res.text).toContain('9955')
      })
  })

  it('POST /{nomsId}/tagged-bail/review/add', () => {
    const adjustments = {}
    adjustments[SESSION_ID] = populatedAdjustment
    adjustmentsStoreService.getById.mockReturnValue(populatedAdjustment)
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    return request(app)
      .post(`/${NOMS_ID}/tagged-bail/review/add/${SESSION_ID}`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/success?message=%7B%22action%22:%22TAGGED_BAIL_UPDATED%22%7D`)
  })
})

describe('POST /{nomsId}/tagged-bail/days/:addOrEdit validation tests', () => {
  test.each`
    addOrEdit | redirectLocation
    ${'add'}  | ${`/${NOMS_ID}/tagged-bail/review/add/${SESSION_ID}`}
  `('POST of days when content is valid redirects correctly', async ({ addOrEdit, redirectLocation }) => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.validate.mockResolvedValue([])
    adjustmentsService.findByPerson.mockResolvedValue([])
    return request(app)
      .post(`/${NOMS_ID}/tagged-bail/days/${addOrEdit}/${SESSION_ID}`)
      .send({ days: 1 })
      .type('form')
      .expect(302)
      .expect('Location', redirectLocation)
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/tagged-bail/dates/add empty form validation', async ({ addOrEdit }) => {
    const adjustments = {}
    adjustments[SESSION_ID] = blankAdjustment
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    adjustmentsService.findByPerson.mockResolvedValue([])
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .post(`/${NOMS_ID}/tagged-bail/days/${addOrEdit}/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the number of days for the tagged bail')
      })
  })

  test.each`
    addOrEdit | days
    ${'add'}  | ${`0`}
    ${'add'}  | ${`-1`}
    ${'add'}  | ${`1.5`}
    ${'edit'} | ${`0`}
    ${'edit'} | ${`-1`}
    ${'edit'} | ${`1.5`}
  `('POST /{nomsId}/tagged-bail/dates/add invalid number entered for days', async ({ addOrEdit, days }) => {
    const adjustments = {}
    adjustments[SESSION_ID] = blankAdjustment
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    adjustmentsService.findByPerson.mockResolvedValue([])
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .post(`/${NOMS_ID}/tagged-bail/days/${addOrEdit}/${SESSION_ID}`)
      .send({ days })
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter a positive whole number for the number of days on tagged bail')
      })
  })
})

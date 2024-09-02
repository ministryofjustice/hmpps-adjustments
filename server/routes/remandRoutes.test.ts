import dayjs from 'dayjs'
import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import './testutils/toContainInOrder'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import SessionAdjustment from '../@types/AdjustmentTypes'
import {
  CalculateReleaseDatesValidationMessage,
  UnusedDeductionCalculationResponse,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import ParamStoreService from '../services/paramStoreService'
import UnusedDeductionsService from '../services/unusedDeductionsService'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/calculateReleaseDatesService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/paramStoreService')
jest.mock('../services/unusedDeductionsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const calculateReleaseDatesService = new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const paramStoreService = new ParamStoreService() as jest.Mocked<ParamStoreService>
const unusedDeductionsService = new UnusedDeductionsService(null, null) as jest.Mocked<UnusedDeductionsService>

const NOMS_ID = 'ABC123'
const SESSION_ID = '123-abc'
const ADJUSTMENT_ID = '9991'

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

const offencesWithAndWithoutStartDates: PrisonApiOffence[] = [
  {
    offenderChargeId: 1,
    offenceDescription: 'Doing a crime',
    offenceStartDate: '2021-01-04',
    offenceEndDate: '2021-01-05',
  },
  { offenderChargeId: 2, offenceDescription: 'Doing a different crime' },
]

const offencesWithoutStartDates: PrisonApiOffence[] = [
  {
    offenderChargeId: 1,
    offenceDescription: 'Doing a crime',
  },
  { offenderChargeId: 2, offenceDescription: 'Doing a different crime' },
]

const blankAdjustment = {
  person: NOMS_ID,
  bookingId: 12345,
  adjustmentType: 'REMAND',
} as SessionAdjustment

const adjustmentWithDates = {
  ...blankAdjustment,
  fromDate: '2023-01-01',
  toDate: '2023-01-10',
} as SessionAdjustment

const adjustmentWithDatesAndCharges = {
  ...adjustmentWithDates,
  remand: {
    chargeId: [1, 2],
  },
  complete: true,
} as SessionAdjustment

const nomisAdjustment = {
  ...adjustmentWithDatesAndCharges,
  remand: null,
  sentenceSequence: 1,
} as Adjustment

const remandAdjustment = {
  ...adjustmentWithDatesAndCharges,
  remand: null,
  sentenceSequence: 1,
} as Adjustment

const remandOverlapWithSentenceMessage = {
  code: 'REMAND_OVERLAPS_WITH_SENTENCE',
  arguments: ['2021-01-01', '2021-02-01', '2021-01-02', '2021-02-02'],
} as CalculateReleaseDatesValidationMessage

const mockedUnusedDeductionCalculationResponse = {
  unusedDeductions: 29,
  validationMessages: [remandOverlapWithSentenceMessage],
} as UnusedDeductionCalculationResponse

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      adjustmentsStoreService,
      calculateReleaseDatesService,
      paramStoreService,
      unusedDeductionsService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Remand routes tests', () => {
  it('GET /{nomsId}/remand/view Shows correct information', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue([sentenceAndOffenceBaseRecord])
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'NONE',
      [remandAdjustment],
    ])
    return request(app)
      .get(`/${NOMS_ID}/remand/view`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Remand overview')
        expect(res.text).toContain('From 01 Jan 2023 to 10 Jan 2023')
        expect(res.text).toContain('Doing a crime')
        expect(res.text).toContain('Heard at Court 1')
      })
  })

  it('GET /{nomsId}/remand/add okay', () => {
    adjustmentsStoreService.store.mockReturnValue(SESSION_ID)
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get(`/${NOMS_ID}/remand/add`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
  })

  it('GET /{nomsId}/remand/add no applicable', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue([])
    return request(app)
      .get(`/${NOMS_ID}/remand/add`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/remand/no-applicable-sentences`)
  })

  it('GET /{nomsId}/remand/no-applicable-sentences', () => {
    return request(app)
      .get(`/${NOMS_ID}/remand/no-applicable-sentences`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain(`<a href="/${NOMS_ID}" class="govuk-back-link">Back</a>`)
        expect(res.text).toContain('Remand cannot be applied as none of the sentence offences are eligible for remand.')
      })
  })

  it('GET /{nomsId}/remand/dates/add', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = blankAdjustment
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/remand/dates/add/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain(`<a href="/${NOMS_ID}" class="govuk-back-link">Back</a>`)
        expect(res.text).toContain('Remand start date')
        expect(res.text).toContain('Remand end date')
        expect(res.text).toContain('Continue')
      })
  })

  describe('POST /{nomsId}/remand/dates/:addOrEdit validation tests', () => {
    test.each`
      addOrEdit | redirectLocation
      ${'add'}  | ${`/${NOMS_ID}/remand/offences/add/${SESSION_ID}`}
      ${'edit'} | ${`/${NOMS_ID}/remand/edit/${SESSION_ID}`}
    `('POST of dates when content is valid redirects correctly', async ({ addOrEdit, redirectLocation }) => {
      adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
      adjustmentsService.validate.mockResolvedValue([])
      adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
      return request(app)
        .post(`/${NOMS_ID}/remand/dates/${addOrEdit}/${SESSION_ID}`)
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
        .expect('Location', redirectLocation)
    })

    test.each`
      addOrEdit
      ${'add'}
      ${'edit'}
    `('POST /{nomsId}/remand/dates/add empty form validation', async ({ addOrEdit }) => {
      const adjustments: Record<string, SessionAdjustment> = {}
      adjustments[SESSION_ID] = blankAdjustment
      adjustmentsStoreService.getAll.mockReturnValue(adjustments)
      adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
      adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
      return request(app)
        .post(`/${NOMS_ID}/remand/dates/${addOrEdit}/${SESSION_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('This date must include a valid day, month and year')
        })
    })

    test.each`
      addOrEdit
      ${'add'}
      ${'edit'}
    `('POST /{nomsId}/remand/dates/addOrEdit to date after from', async ({ addOrEdit }) => {
      const adjustments: Record<string, SessionAdjustment> = {}
      adjustments[SESSION_ID] = blankAdjustment
      adjustmentsStoreService.getAll.mockReturnValue(adjustments)
      adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
      adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
      return request(app)
        .post(`/${NOMS_ID}/remand/dates/${addOrEdit}/${SESSION_ID}`)
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

    test.each`
      addOrEdit
      ${'add'}
      ${'edit'}
    `('POST /{nomsId}/remand/dates/:addOrEdit dates in future', async ({ addOrEdit }) => {
      const adjustments: Record<string, SessionAdjustment> = {}
      adjustments[SESSION_ID] = blankAdjustment
      adjustmentsStoreService.getAll.mockReturnValue(adjustments)
      adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
      adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
      return request(app)
        .post(`/${NOMS_ID}/remand/dates/${addOrEdit}/${SESSION_ID}`)
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

    test.each`
      addOrEdit
      ${'add'}
      ${'edit'}
    `('POST /{nomsId}/remand/dates/addOrEdit fromDate before earliest offence date', async ({ addOrEdit }) => {
      const adjustments: Record<string, SessionAdjustment> = {}
      adjustments[SESSION_ID] = blankAdjustment
      adjustmentsStoreService.getAll.mockReturnValue(adjustments)
      adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
      adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
      return request(app)
        .post(`/${NOMS_ID}/remand/dates/${addOrEdit}/${SESSION_ID}`)
        .send({
          'from-day': '5',
          'from-month': '3',
          'from-year': '2000',
          'to-day': '20',
          'to-month': '3',
          'to-year': '2023',
        })
        .type('form')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('The remand period cannot start before the earliest offence date, on 04 Jan 2021')
        })
    })

    test.each`
      addOrEdit
      ${'add'}
      ${'edit'}
    `(
      'POST /{nomsId}/remand/dates/addOrEdit fromDate before earliest offence date when some offence dates are not set',
      async ({ addOrEdit }) => {
        const adjustments: Record<string, SessionAdjustment> = {}
        adjustments[SESSION_ID] = blankAdjustment
        adjustmentsStoreService.getAll.mockReturnValue(adjustments)
        adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
        adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
        prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue([
          { ...sentenceAndOffenceBaseRecord, offences: offencesWithAndWithoutStartDates },
        ])
        return request(app)
          .post(`/${NOMS_ID}/remand/dates/${addOrEdit}/${SESSION_ID}`)
          .send({
            'from-day': '5',
            'from-month': '3',
            'from-year': '2000',
            'to-day': '20',
            'to-month': '3',
            'to-year': '2023',
          })
          .type('form')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain(
              'The remand period cannot start before the earliest offence date, on 04 Jan 2021',
            )
          })
      },
    )

    test.each`
      addOrEdit | redirectLocation
      ${'add'}  | ${`/${NOMS_ID}/remand/offences/add/${SESSION_ID}`}
      ${'edit'} | ${`/${NOMS_ID}/remand/edit/${SESSION_ID}`}
    `(
      'POST /{nomsId}/remand/dates/addOrEdit fromDate before earliest offence date when all offence dates are not set (success)',
      async ({ addOrEdit, redirectLocation }) => {
        const adjustments: Record<string, SessionAdjustment> = {}
        adjustments[SESSION_ID] = blankAdjustment
        adjustmentsStoreService.getAll.mockReturnValue(adjustments)
        adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
        adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
        prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue([
          { ...sentenceAndOffenceBaseRecord, offences: offencesWithoutStartDates },
        ])
        return request(app)
          .post(`/${NOMS_ID}/remand/dates/${addOrEdit}/${SESSION_ID}`)
          .send({
            'from-day': '5',
            'from-month': '3',
            'from-year': '2000',
            'to-day': '20',
            'to-month': '3',
            'to-year': '2023',
          })
          .type('form')
          .expect(302)
          .expect('Location', redirectLocation)
      },
    )

    test.each([
      {
        adjustment: {
          ...blankAdjustment,
          fromDate: '2023-01-06',
          toDate: '2023-01-10',
          id: '123-abb',
          from: '06 Jan 2023',
          to: '10 Jan 2023',
        },
        from: { year: '2023', month: '01', day: '01' },
        to: { year: '2023', month: '03', day: '20' },
        id: '9991',
      },
      {
        adjustment: {
          ...blankAdjustment,
          fromDate: '2023-01-07',
          toDate: '2023-01-10',
          id: '123-abb',
          from: '07 Jan 2023',
          to: '10 Jan 2023',
        },
        from: { year: '2023', month: '01', day: '01' },
        to: { year: '2023', month: '01', day: '07' },
        id: '9992',
      },
      {
        adjustment: {
          ...blankAdjustment,
          fromDate: '2023-01-06',
          toDate: '2023-01-10',
          id: '123-abb',
          from: '06 Jan 2023',
          to: '10 Jan 2023',
        },
        from: { year: '2023', month: '01', day: '1' },
        to: { year: '2023', month: '01', day: '10' },
        id: '9993',
      },
    ])('POST /{nomsId}/remand/dates/addOrEdit overlapping remand periods', ({ adjustment, from, to, id }) => {
      const adjustments: Record<string, SessionAdjustment> = {}
      adjustments[SESSION_ID] = blankAdjustment
      adjustmentsStoreService.getAll.mockReturnValue(adjustments)
      adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
      adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([adjustment, { ...adjustment, id }])
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue([
        { ...sentenceAndOffenceBaseRecord, offences: offencesWithAndWithoutStartDates },
      ])
      return request(app)
        .post(`/${NOMS_ID}/remand/dates/edit/${id}`)
        .send({
          'from-day': from.day,
          'from-month': from.month,
          'from-year': from.year,
          'to-day': to.day,
          'to-month': to.month,
          'to-year': to.year,
        })
        .type('form')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain(
            `The remand dates overlap with another remand period ${adjustment.from} to ${adjustment.to}`,
          )
        })
    })
  })

  describe('GET and POST tests for /{nomsId}/remand/dates/:addOrEdit', () => {
    test.each`
      addOrEdit | title                    | backLink
      ${'add'}  | ${'Select the offences'} | ${`/${NOMS_ID}/remand/dates/add/${SESSION_ID}`}
      ${'edit'} | ${'Edit offences'}       | ${`/${NOMS_ID}/remand/edit/${SESSION_ID}`}
    `('GET /{nomsId}/remand/offences/:addOrEdit', async ({ addOrEdit, title, backLink }) => {
      const adjustments: Record<string, SessionAdjustment> = {}
      adjustments[SESSION_ID] = blankAdjustment
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
      adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDates)
      return request(app)
        .get(`/${NOMS_ID}/remand/offences/${addOrEdit}/${SESSION_ID}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain(title)
          expect(res.text).toContain('Anon')
          expect(res.text).toContain('Nobody')
          expect(res.text).toContain(`<a href="${backLink}" class="govuk-back-link">Back</a>`)
          expect(res.text).toContainInOrder(['10', 'day(s)'])
          expect(res.text).toContainInOrder([
            'Court 1',
            'CASE001',
            'Doing a crime',
            'Committed from',
            '04 Jan 2021',
            'to',
            '05 Jan 2021',
            'Doing a different crime',
            'Committed on',
            '06 Mar 2021',
          ])
        })
    })

    test.each`
      addOrEdit | redirectLocation
      ${'add'}  | ${`/${NOMS_ID}/remand/review`}
      ${'edit'} | ${`/${NOMS_ID}/remand/edit/${SESSION_ID}`}
    `('POST /{nomsId}/remand/offence/:addOrEdit valid', async ({ addOrEdit, redirectLocation }) => {
      adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDates)
      return request(app)
        .post(`/${NOMS_ID}/remand/offences/${addOrEdit}/${SESSION_ID}`)
        .send({
          chargeId: ['5', '6', '7'],
        })
        .type('form')
        .expect(302)
        .expect('Location', redirectLocation)
    })

    test.each`
      addOrEdit
      ${'add'}
      ${'edit'}
    `('POST /{nomsId}/remand/offence/:addOrEdit no offences selected', async ({ addOrEdit }) => {
      prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
      adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDates)
      return request(app)
        .post(`/${NOMS_ID}/remand/offences/${addOrEdit}/${SESSION_ID}`)
        .type('form')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('You must select the offence(s) which relate to the remand period.')
        })
    })
  })

  it('GET /{nomsId}/remand/review', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockResolvedValue({
      unusedDeductions: 50,
      validationMessages: [remandOverlapWithSentenceMessage],
    })
    calculateReleaseDatesService.unusedDeductionsHandlingCRDError.mockResolvedValue(
      mockedUnusedDeductionCalculationResponse,
    )
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    return request(app)
      .get(`/${NOMS_ID}/remand/review`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain(
          `<a href="/${NOMS_ID}/remand/offences/add/${SESSION_ID}" class="govuk-back-link">Back</a>`,
        )
        expect(res.text).toContainInOrder([
          'Remand cannot be applied when a sentence is being served.',
          'The remand dates from 02 Jan 2021 to 02 Feb 2021 overlaps with the sentence starting on 01 Jan 2021 with a release date of the 01 Feb 2021',
        ])
        expect(res.text).toContain('Review remand details')
        expect(res.text).toContainInOrder([
          'Remand period',
          '01 Jan 2023 to 10 Jan 2023',
          'Offences',
          'Doing a crime',
          'Doing a different crime',
          'Days spent on remand',
          '10',
        ])
      })
  })

  it('POST /{nomsId}/remand/review yes more to add', () => {
    return request(app)
      .post(`/${NOMS_ID}/remand/review`)
      .type('form')
      .send({
        another: 'yes',
      })
      .expect(302)
      .expect('Location', `/${NOMS_ID}/remand/add`)
  })

  it('POST /{nomsId}/remand/review no more to add', () => {
    return request(app)
      .post(`/${NOMS_ID}/remand/review`)
      .type('form')
      .send({
        another: 'no',
      })
      .expect(302)
      .expect('Location', `/${NOMS_ID}/remand/save`)
  })

  it('POST /{nomsId}/remand/review nothing selected', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    return request(app)
      .post(`/${NOMS_ID}/remand/review`)
      .type('form')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select an answer')
      })
  })
  it('GET /{nomsId}/remand/save calculated deductions', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.findByPerson.mockResolvedValue([])
    calculateReleaseDatesService.unusedDeductionsHandlingCRDError.mockResolvedValue(
      mockedUnusedDeductionCalculationResponse,
    )
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    return request(app)
      .get(`/${NOMS_ID}/remand/save`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain(
          'When you save this remand, the unused deductions will automatically be recorded. Check that the unused remand alert has been added.',
        )
        expect(res.text).toContainInOrder(['Remand period', 'Days spent on remand', '10', 'Total days', '10'])
      })
  })
  it('GET /{nomsId}/remand/save error from deductions', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.findByPerson.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockRejectedValue({ error: 'an error' })
    calculateReleaseDatesService.unusedDeductionsHandlingCRDError.mockResolvedValue(null)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    return request(app)
      .get(`/${NOMS_ID}/remand/save`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('unused deductions')
      })
  })
  it('POST /{nomsId}/remand/save', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    return request(app)
      .post(`/${NOMS_ID}/remand/save`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22REMAND%22,%22action%22:%22CREATE%22,%22days%22:10%7D`,
      )
  })

  it('GET /{nomsId}/remand/remove', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([adjustmentWithDatesAndCharges])
    calculateReleaseDatesService.calculateUnusedDeductions.mockResolvedValue({
      unusedDeductions: 50,
      validationMessages: [],
    })

    return request(app)
      .get(`/${NOMS_ID}/remand/remove/${ADJUSTMENT_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Delete remand')
        expect(res.text).toContain('01 Jan 2023 to 10 Jan 2023')
        expect(res.text).toContainInOrder(['Committed from', '04 Jan 2021', 'to', '05 Jan 2021'])
        expect(res.text).toContain('Doing a crime')
      })
  })

  it('POST /{nomsId}/remand/remove', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)

    return request(app)
      .post(`/${NOMS_ID}/remand/remove/${ADJUSTMENT_ID}`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/success?message=%7B%22type%22:%22REMAND%22,%22action%22:%22REMOVE%22%7D`)
  })

  it('GET /{nomsId}/remand/edit with successful unused deductions calculation', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockResolvedValue({
      unusedDeductions: 50,
      validationMessages: [],
    })

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${ADJUSTMENT_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Edit remand')
        expect(res.text).toContain('01 Jan 2023 to 10 Jan 2023')
        expect(res.text).toContainInOrder(['Committed from', '04 Jan 2021', 'to', '05 Jan 2021'])
        expect(res.text).toContain('Doing a crime')
      })
  })

  it('GET /{nomsId}/remand/edit unused deductions calculation errors', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockRejectedValue('REJECTED')

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${ADJUSTMENT_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain('Edit remand')
      })
  })

  it('GET /{nomsId}/remand/edit without changes', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockRejectedValue('REJECTED')

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${ADJUSTMENT_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).not.toContain('Confirm and save')
      })
  })

  it('GET /{nomsId}/remand/edit with changes', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockRejectedValue('REJECTED')

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${ADJUSTMENT_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
      })
  })

  it('GET /{nomsId}/remand/edit with different charges', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)
    adjustmentsStoreService.getById.mockReturnValue({ ...adjustmentWithDatesAndCharges, remand: { chargeId: [1] } })
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockRejectedValue('REJECTED')

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${ADJUSTMENT_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
      })
  })

  it('GET /{nomsId}/remand/edit with NOMIS adjustments', () => {
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.get.mockResolvedValue(nomisAdjustment)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    calculateReleaseDatesService.calculateUnusedDeductions.mockRejectedValue('REJECTED')

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${ADJUSTMENT_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
      })
  })

  it('GET /{nomsId}/remand/dates/edit', () => {
    const adjustments = {}
    adjustmentsService.get.mockResolvedValue(adjustmentWithDatesAndCharges)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/remand/dates/edit/${ADJUSTMENT_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Anon')
        expect(res.text).toContain('Nobody')
        expect(res.text).toContain(`<a href="/${NOMS_ID}/remand/edit/9991" class="govuk-back-link">Back</a>`)
        expect(res.text).toContain('Remand start date')
        expect(res.text).toContain('Remand end date')
        expect(res.text).toContain('Continue')
      })
  })

  it('POST /{nomsId}/remand/edit/:id dps adjustment', () => {
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDatesAndCharges)

    return request(app)
      .post(`/${NOMS_ID}/remand/edit/${SESSION_ID}`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/success?message=%7B%22type%22:%22REMAND%22,%22action%22:%22UPDATE%22%7D`)
  })

  it('POST /{nomsId}/remand/edit/:id nomis adjustment sets charge ids.', () => {
    adjustmentsStoreService.getById.mockReturnValue(nomisAdjustment)
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)

    return request(app)
      .post(`/${NOMS_ID}/remand/edit/${SESSION_ID}`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/success?message=%7B%22type%22:%22REMAND%22,%22action%22:%22UPDATE%22%7D`)
      .expect(() => {
        const updateCall = adjustmentsService.update.mock.calls[0]
        const updateAdjustment = updateCall[1] as Adjustment
        expect(updateAdjustment.remand.chargeId).toEqual([1, 2])
      })
  })

  it('GET /{nomsId}/remand/edit/:id No save button because of no changes made', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDatesAndCharges)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsService.getAdjustmentsExceptOneBeingEdited.mockResolvedValue([adjustmentWithDatesAndCharges])

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).not.toContain('Confirm and save')
        expect(res.text).toContain('Edit remand')
      })
  })

  it('GET /{nomsId}/remand/edit/:id Review deductions journey', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDatesAndCharges)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsService.getAdjustmentsExceptOneBeingEdited.mockResolvedValue([adjustmentWithDatesAndCharges])
    paramStoreService.get.mockReturnValue(true)

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(`<a href="/${NOMS_ID}/review-deductions" class="govuk-back-link">Back</a>`)
        expect(res.text).toContain('Confirm and save')
      })
  })

  it('GET /{nomsId}/remand/edit/:id Save button visible because of changes made', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDatesAndCharges)
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsService.getAdjustmentsExceptOneBeingEdited.mockResolvedValue([adjustmentWithDatesAndCharges])
    const modifiedAdjustmentWithDatesAndCharges = { ...adjustmentWithDatesAndCharges }
    modifiedAdjustmentWithDatesAndCharges.fromDate = '2023-01-07'
    adjustmentsService.get.mockResolvedValue(modifiedAdjustmentWithDatesAndCharges)

    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).not.toContain('Edit remand')
      })
  })

  it('GET /{nomsId}/remand/edit with CRD error', () => {
    const adjustments: Record<string, SessionAdjustment> = {}
    adjustments[SESSION_ID] = adjustmentWithDatesAndCharges
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([])
    adjustmentsStoreService.getById.mockReturnValue(adjustmentWithDatesAndCharges)
    paramStoreService.get.mockReturnValue(false)
    calculateReleaseDatesService.calculateUnusedDeductions.mockResolvedValue({
      unusedDeductions: 50,
      validationMessages: [remandOverlapWithSentenceMessage],
    })
    calculateReleaseDatesService.unusedDeductionsHandlingCRDError.mockResolvedValue(
      mockedUnusedDeductionCalculationResponse,
    )
    adjustmentsStoreService.getAll.mockReturnValue(adjustments)
    adjustmentsService.getAdjustmentsExceptOneBeingEdited.mockResolvedValue([adjustmentWithDatesAndCharges])
    return request(app)
      .get(`/${NOMS_ID}/remand/edit/${ADJUSTMENT_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContainInOrder([
          'Remand cannot be applied when a sentence is being served.',
          'The remand dates from 02 Jan 2021 to 02 Feb 2021 overlaps with the sentence starting on 01 Jan 2021 with a release date of the 01 Feb 2021',
          'Update the remand dates to continue.',
        ])
      })
  })

  it('GET /{nomsId}/remand/view DPS adjustment shows correct information', () => {
    prisonerService.getSentencesAndOffences.mockResolvedValue(stubbedSentencesAndOffences)
    unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments.mockResolvedValue([
      'UNSUPPORTED',
      [adjustmentWithDatesAndCharges],
    ])
    prisonerService.getSentencesAndOffencesFilteredForRemand.mockResolvedValue(stubbedSentencesAndOffences)
    return request(app)
      .get(`/${NOMS_ID}/remand/view`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Remand overview')
        expect(res.text).toContain(
          'Some of the details recorded cannot be used for a sentence calculation. This means unused deductions cannot be automatically calculated by this service',
        )
        expect(res.text).toContain('From 01 Jan 2023 to 10 Jan 2023')
        expect(res.text).toContain('Doing a crime')
      })
  })
})

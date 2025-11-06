import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdditionalDaysAwardedBackendService from '../services/additionalDaysAwardedBackendService'
import { AdasToReview, PadasToReview } from '../@types/AdaTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import ReviewAndSubmitAdaViewModel from '../model/reviewAndSubmitAdaViewModel'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/identifyRemandPeriodsService')
jest.mock('../services/adjustmentsStoreService')
jest.mock('../services/additionalDaysAwardedBackendService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const identifyRemandPeriodsService = new IdentifyRemandPeriodsService(null) as jest.Mocked<IdentifyRemandPeriodsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>
const additionalDaysAwardedBackendService = new AdditionalDaysAwardedBackendService(
  null,
  null,
) as jest.Mocked<AdditionalDaysAwardedBackendService>

const NOMS_ID = 'ABC123'

const allPadas = {
  awaitingApproval: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
    },
  ],
  suspended: [],
  awarded: [],
  quashed: [],
  totalAwarded: 0,
  totalQuashed: 0,
  totalAwaitingApproval: 104,
  totalSuspended: 0,
  intercept: {
    number: 2,
    type: 'UPDATE',
    anyProspective: false,
  },
} as AdasToReview

const noAwaitingApproval = {
  awaitingApproval: [],
  suspended: [],
  awarded: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'AWARDED_OR_PENDING',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
    },
  ],
  quashed: [],
  totalAwarded: 5,
  totalQuashed: 0,
  totalAwaitingApproval: 0,
  totalSuspended: 0,
  intercept: {
    number: 0,
    type: 'NONE',
    anyProspective: false,
  },
} as AdasToReview

const padasAwaitingApprovalAndQuashed = {
  awaitingApproval: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'AWARDED_OR_PENDING',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
    },
  ],
  suspended: [],
  awarded: [],
  quashed: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          dateChargeProved: '2023-08-03',
          chargeNumber: '1526230',
          heardAt: 'Kirkham (HMP)',
          status: 'QUASHED',
          days: 25,
          toBeServed: 'Forthwith',
        },
      ],
      total: 25,
      status: 'PENDING_APPROVAL',
    },
  ],
  totalAwarded: 0,
  totalQuashed: 0,
  totalAwaitingApproval: 104,
  totalSuspended: 0,
  intercept: {
    number: 2,
    type: 'UPDATE',
    anyProspective: false,
  },
} as AdasToReview

const onlyADAsToReview = {
  awaitingApproval: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'AWARDED_OR_PENDING',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
    },
  ],
  suspended: [],
  awarded: [],
  quashed: [],
  totalAwarded: 0,
  totalQuashed: 0,
  totalAwaitingApproval: 104,
  totalSuspended: 0,
  intercept: {
    number: 2,
    type: 'FIRST_TIME',
    anyProspective: false,
  },
  showExistingAdaMessage: false,
  totalExistingAdas: null,
} as AdasToReview

const mixPadasAndPending = {
  awaitingApproval: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'AWARDED_OR_PENDING',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
    },
  ],
  suspended: [],
  awarded: [],
  quashed: [],
  totalAwarded: 0,
  totalQuashed: 0,
  totalAwaitingApproval: 104,
  totalSuspended: 0,
  intercept: {
    number: 2,
    type: 'UPDATE',
    anyProspective: false,
  },
  showExistingAdaMessage: false,
  totalExistingAdas: null,
} as AdasToReview

const prospectiveToReview = {
  prospective: [
    {
      dateChargeProved: '2023-08-03',
      charges: [
        {
          chargeNumber: '1525916',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'PROSPECTIVE',
          toBeServed: 'Concurrent',
        },
        {
          chargeNumber: '1525917',
          dateChargeProved: '2023-08-03',
          days: 5,
          heardAt: 'Moorland (HMP & YOI)',
          status: 'AWARDED_OR_PENDING',
          toBeServed: 'Concurrent',
        },
      ],
      total: 5,
      status: 'PENDING_APPROVAL',
    },
  ],
  totalProspective: 104,
} as PadasToReview

let app: Express

const defaultUser = user

let userInTest = defaultUser

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      identifyRemandPeriodsService,
      adjustmentsStoreService,
      additionalDaysAwardedBackendService,
    },
    userSupplier: () => userInTest,
  })
})

afterEach(() => {
  userInTest = defaultUser
  jest.resetAllMocks()
})

describe('Additional Days Awarded routes tests', () => {
  describe('Review and approve tests', () => {
    it('GET /{nomsId}/additional-days/review-and-approve when only PADAs exist redirects to review and submit', () => {
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(allPadas)

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-approve`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}/additional-days/review-and-submit?referrer=REVIEW_PROSPECTIVE`)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when no awaiting approval records exist does not redirect', () => {
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(noAwaitingApproval)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })

    it('GET /{nomsId}/additional-days/review-and-approve when quashed records exist does not redirect', () => {
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(padasAwaitingApprovalAndQuashed)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })

    it('GET /{nomsId}/additional-days/review-and-approve Review message when ADAs need approval', () => {
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(onlyADAsToReview)

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-approve`)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain(
            'ADA adjustments are based on adjudication records. Before you approve ADAs, check that:',
          )
          expect(res.text).toContain('ADAs have not been incorrectly recorded as PADAs.')
          expect(res.text).toContain('The consecutive and concurrent information for each ADA is correct.')
        })
    })

    it('GET /{nomsId}/additional-days/review-and-approve No Review message when there are no ADAs to be approved', () => {
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(noAwaitingApproval)

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-approve`)
        .expect(200)
        .expect(res => {
          expect(res.text).not.toContain(
            'ADA adjustments are based on adjudication records. Before you approve ADAs, check that:',
          )
          expect(res.text).not.toContain('ADAs have not been incorrectly recorded as PADAs.')
          expect(res.text).not.toContain('The consecutive and concurrent information for each ADA is correct.')
        })
    })

    it('GET /{nomsId}/additional-days/review-and-approve when mix of PADAs and others exist does not redirect', () => {
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(mixPadasAndPending)

      return request(app).get(`/${NOMS_ID}/additional-days/review-and-approve`).expect(200)
    })
    it('GET /{nomsId}/additional-days/review-and-approve when no matching adjudication exists', () => {
      additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue({
        ...noAwaitingApproval,
        showExistingAdaMessage: true,
        totalExistingAdas: 10,
        adjustmentsToRemove: [
          {
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: false },
            bookingId: 123,
            days: 10,
            fromDate: '2023-08-03',
            person: NOMS_ID,
            prisonId: undefined,
          } as Adjustment,
        ],
      })

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-approve`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Review and delete ADAs')
          expect(res.text).toContain('Pending deletion')
          expect(res.text).toContain('3 August 2023')
          expect(res.text).toContain('Total ADAs removed from calculation')
          expect(res.text).toContain('10')
        })
    })

    it('GET /{nomsId}/additional-days/review-and-submit when no matching adjudication exists', () => {
      additionalDaysAwardedBackendService.getReviewAndSubmitModel.mockResolvedValue(
        new ReviewAndSubmitAdaViewModel(
          [],
          [
            {
              adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
              additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: false },
              bookingId: 123,
              days: 10,
              fromDate: '2023-08-03',
              person: NOMS_ID,
              prisonId: undefined,
            } as Adjustment,
          ],
          [],
        ),
      )

      return request(app)
        .get(`/${NOMS_ID}/additional-days/review-and-submit`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Total ADAs removed from calculation')
          expect(res.text).toContain('10')
        })
    })
  })

  it('GET /{nomsId}/additional-days/review-prospective', () => {
    additionalDaysAwardedBackendService.getPadasToApprove.mockResolvedValue(prospectiveToReview)

    return request(app)
      .get(`/${NOMS_ID}/additional-days/review-prospective`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select all the relevant PADAs')
        expect(res.text).toContain('Date charge proved 3 August 2023 at Moorland')
      })
  })

  it('POST /{nomsId}/additional-days/review-prospective validation error', () => {
    additionalDaysAwardedBackendService.getPadasToApprove.mockResolvedValue(prospectiveToReview)

    // .send({ 'from-day': '6', 'from-month': '3', 'from-year': '23', days: -1 })
    return request(app)
      .post(`/${NOMS_ID}/additional-days/review-prospective`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select the PADAs that apply, or select &#39;None of these PADAs apply&#39;')
      })
  })

  it('POST /{nomsId}/additional-days/review-prospective select pada', () => {
    additionalDaysAwardedBackendService.getPadasToApprove.mockResolvedValue(prospectiveToReview)

    return request(app)
      .post(`/${NOMS_ID}/additional-days/review-prospective`)
      .send({ prospective: '2023-08-03' })
      .expect(302)
      .expect('Location', `/${NOMS_ID}/additional-days/review-and-approve`)
      .expect(() => {
        expect(additionalDaysAwardedBackendService.storeSelectedPadas.mock.calls).toHaveLength(1)
      })
  })

  it('POST /{nomsId}/additional-days/review-prospective none apply with some pending approval', () => {
    additionalDaysAwardedBackendService.getPadasToApprove.mockResolvedValue(prospectiveToReview)
    additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(mixPadasAndPending)
    return request(app)
      .post(`/${NOMS_ID}/additional-days/review-prospective`)
      .send({ none: 'none' })
      .expect(302)
      .expect('Location', `/${NOMS_ID}/additional-days/review-and-approve`)
      .expect(() => {
        expect(additionalDaysAwardedBackendService.storeSelectedPadas.mock.calls).toHaveLength(1)
      })
  })

  it('POST /{nomsId}/additional-days/review-prospective none apply with nothing pending approval', () => {
    additionalDaysAwardedBackendService.getPadasToApprove.mockResolvedValue(prospectiveToReview)
    additionalDaysAwardedBackendService.getAdasToApprove.mockResolvedValue(noAwaitingApproval)
    return request(app)
      .post(`/${NOMS_ID}/additional-days/review-prospective`)
      .send({ none: 'none' })
      .expect(302)
      .expect('Location', `/${NOMS_ID}`)
      .expect(() => {
        expect(additionalDaysAwardedBackendService.submitAdjustments.mock.calls).toHaveLength(1)
        expect(additionalDaysAwardedBackendService.storeSelectedPadas.mock.calls).toHaveLength(1)
      })
  })

  it('GET /{nomsId}/additional-days/view to display the summary table for 2 set of charges', () => {
    additionalDaysAwardedBackendService.viewAdjustments.mockResolvedValue({
      ...noAwaitingApproval,
      adjustments: [
        {
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: false },
          bookingId: 123,
          days: 10,
          fromDate: '2023-08-03',
          person: NOMS_ID,
          prisonId: undefined,
        } as Adjustment,
        {
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          additionalDaysAwarded: { adjudicationId: ['1525919', '1525920', '1525921'], prospective: false },
          bookingId: 123,
          days: 10,
          fromDate: '2023-08-03',
          person: NOMS_ID,
          prisonId: undefined,
        } as Adjustment,
      ],
    })

    return request(app)
      .get(`/${NOMS_ID}/additional-days/view`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(`Date charge proved`)
      })
  })
  it('GET /{nomsId}/additional-days/view to not display the summary table for 1 set of charges', () => {
    additionalDaysAwardedBackendService.viewAdjustments.mockResolvedValue({
      ...noAwaitingApproval,
      adjustments: [
        {
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: false },
          bookingId: 123,
          days: 10,
          fromDate: '2023-08-03',
          person: NOMS_ID,
          prisonId: undefined,
        } as Adjustment,
      ],
    })

    return request(app)
      .get(`/${NOMS_ID}/additional-days/view`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain(`Date charge proved`)
      })
  })
  it('GET /{nomsId}/additional-days/view to display summary table if there is prospective adjustment', () => {
    additionalDaysAwardedBackendService.viewAdjustments.mockResolvedValue({
      ...noAwaitingApproval,
      adjustments: [
        {
          adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
          additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: true },
          bookingId: 123,
          days: 10,
          fromDate: '2023-08-03',
          person: NOMS_ID,
          prisonId: undefined,
        } as Adjustment,
      ],
    })

    return request(app)
      .get(`/${NOMS_ID}/additional-days/view`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `<a href="/${NOMS_ID}/additional-days/remove-prospective/2023-08-03">Remove PADA</a>`,
        )
      })
  })

  it('GET /{nomsId}/additional-days/remove-prospective', () => {
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([
      {
        id: 'UUID',
        adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
        additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: true },
        bookingId: 123,
        days: 10,
        fromDate: '2023-08-03',
        person: NOMS_ID,
        prisonId: undefined,
      } as Adjustment,
    ])

    return request(app)
      .get(`/${NOMS_ID}/additional-days/remove-prospective/2023-08-03`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('Total removed ADA')
      })
  })

  it('POST /{nomsId}/additional-days/remove-prospective', () => {
    adjustmentsService.findByPersonOutsideSentenceEnvelope.mockResolvedValue([
      {
        id: 'UUID',
        adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
        additionalDaysAwarded: { adjudicationId: ['1525916', '1525917', '1525918'], prospective: true },
        bookingId: 123,
        days: 10,
        fromDate: '2023-08-03',
        person: NOMS_ID,
        prisonId: undefined,
      } as Adjustment,
    ])

    return request(app)
      .post(`/${NOMS_ID}/additional-days/remove-prospective/2023-08-03`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22ADDITIONAL_DAYS_AWARDED%22,%22action%22:%22UPDATE%22%7D`,
      )
      .expect(() => {
        expect(adjustmentsService.rejectProspectiveAda).toHaveBeenCalledWith(
          NOMS_ID,
          {
            person: NOMS_ID,
            days: 10,
            dateChargeProved: '2023-08-03',
          },
          'user1',
        )
        expect(adjustmentsService.delete).toHaveBeenCalledWith('UUID', 'user1')
      })
  })

  it('GET /{nomsId}/additional-days/review-and-submit has required accessibility role tag present', () => {
    const adas = [
      {
        adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
        additionalDaysAwarded: {
          adjudicationId: ['1525916', '1525917', '1525918'],
          prospective: false,
        },
        bookingId: 123,
        days: 15,
        fromDate: '2023-08-03',
        person: NOMS_ID,
        prisonId: undefined,
      } as Adjustment,
    ]

    additionalDaysAwardedBackendService.getReviewAndSubmitModel.mockResolvedValue(
      new ReviewAndSubmitAdaViewModel(adas, adas, []),
    )

    return request(app)
      .get(`/${NOMS_ID}/additional-days/review-and-submit`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Total ADAs taken into calculation')
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('tr class="govuk-table__row" role="presentation"')
        expect(res.text).toContain('15')
      })
  })

  it('GET /{nomsId}/additional-days/review-and-submit no longer mentions NOMIS', () => {
    const adas = [
      {
        adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
        additionalDaysAwarded: {
          adjudicationId: ['1525916', '1525917', '1525918'],
          prospective: false,
        },
        bookingId: 123,
        days: 15,
        fromDate: '2023-08-03',
        person: NOMS_ID,
        prisonId: undefined,
      } as Adjustment,
    ]
    const existingAdas = [
      {
        adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
        additionalDaysAwarded: {
          prospective: false,
        },
        bookingId: 123,
        days: 16,
        fromDate: '2023-08-03',
        person: NOMS_ID,
        prisonId: undefined,
      } as Adjustment,
    ]

    additionalDaysAwardedBackendService.getReviewAndSubmitModel.mockResolvedValue(
      new ReviewAndSubmitAdaViewModel(adas, existingAdas, []),
    )

    return request(app)
      .get(`/${NOMS_ID}/additional-days/review-and-submit`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The number of ADAs does not match what was originally recorded.')
        expect(res.text).not.toContain('NOMIS')
        expect(res.text).toContain('Total ADAs taken into calculation')
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('tr class="govuk-table__row" role="presentation"')
        expect(res.text).toContain('15')
      })
  })
})

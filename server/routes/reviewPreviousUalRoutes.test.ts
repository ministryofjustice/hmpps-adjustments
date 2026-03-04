import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { Element } from 'domhandler'
import { appWithAllRoutes, user } from './testutils/appSetup'
import PreviousUnlawfullyAtLargeReviewStoreService from '../services/previousUnlawfullyAtLargeReviewStoreService'
import {
  PreviousUnlawfullyAtLargeAdjustmentForReview,
  PreviousUnlawfullyAtLargeReviewRequest,
} from '../@types/adjustments/adjustmentsTypes'
import AdjustmentsService from '../services/adjustmentsService'
import { Message } from '../model/adjustmentsHubViewModel'

jest.mock('../services/adjustmentsService')
jest.mock('../services/previousUnlawfullyAtLargeReviewStoreService')

const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const previousUnlawfullyAtLargeReviewStoreService =
  new PreviousUnlawfullyAtLargeReviewStoreService() as jest.Mocked<PreviousUnlawfullyAtLargeReviewStoreService>

const NOMS_ID = 'ABC123'

let app: Express

const oneOfEveryTypeOfPreviousUal: PreviousUnlawfullyAtLargeAdjustmentForReview[] = [
  {
    id: '1',
    fromDate: '2020-01-01',
    toDate: '2020-01-03',
    days: 3,
    type: 'RECALL',
    prisonName: 'Brixton (HMP)',
    prisonId: 'BXI',
  },
  {
    id: '2',
    fromDate: '2020-02-01',
    toDate: '2020-02-04',
    days: 4,
    type: 'ESCAPE',
    prisonName: 'Brixton (HMP)',
    prisonId: 'BXI',
  },
  {
    id: '3',
    fromDate: '2020-03-01',
    toDate: '2020-03-05',
    days: 5,
    type: 'SENTENCED_IN_ABSENCE',
    prisonName: 'Brixton (HMP)',
    prisonId: 'BXI',
  },
  {
    id: '4',
    fromDate: '2020-04-01',
    toDate: '2020-04-06',
    days: 6,
    type: 'RELEASE_IN_ERROR',
    prisonName: 'Brixton (HMP)',
    prisonId: 'BXI',
  },
  {
    id: '5',
    fromDate: '2020-05-01',
    toDate: '2020-05-07',
    days: 7,
    type: 'IMMIGRATION_DETENTION',
    prisonName: 'Brixton (HMP)',
    prisonId: 'BXI',
  },
]

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      adjustmentsService,
      previousUnlawfullyAtLargeReviewStoreService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Review previous UAL routes', () => {
  describe('GET /{nomsId}/review-previous-unlawfully-at-large-periods', () => {
    it('Should have the correct navigation', () => {
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '1',
          fromDate: '2020-01-01',
          toDate: '2020-01-03',
          days: 3,
          type: 'RECALL',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .get(`/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toStrictEqual(`/${NOMS_ID}`)
          expect($('[data-qa=cancel-button]').attr('href')).toStrictEqual(
            `/${NOMS_ID}/cancel-review-previous-unlawfully-at-large-periods`,
          )
        })
    })

    it('Should redirect to home if there are no previous periods of UAL for review', () => {
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([])
      return request(app)
        .get(`/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}`)
    })

    it('Should display a row for each unreviewed previous period of UAL', () => {
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue(oneOfEveryTypeOfPreviousUal)
      return request(app)
        .get(`/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const table = $('[data-qa=previous-ual-periods-table]')
          expect(table).toHaveLength(1)

          const rows = table.find('tbody tr')
          expect(rows).toHaveLength(5)
          expectRow(rows.eq(0), true, '1 January 2020', '3 January 2020', 'Brixton (HMP)', 'Recall', '3')
          expectRow(
            rows.eq(1),
            true,
            '1 February 2020',
            '4 February 2020',
            'Brixton (HMP)',
            'Escape, including absconds and ROTL failures',
            '4',
          )
          expectRow(rows.eq(2), true, '1 March 2020', '5 March 2020', 'Brixton (HMP)', 'Sentenced in absence', '5')
          expectRow(rows.eq(3), true, '1 April 2020', '6 April 2020', 'Brixton (HMP)', 'Release in error', '6')
          expectRow(rows.eq(4), true, '1 May 2020', '7 May 2020', 'Brixton (HMP)', 'Immigration detention', '7')
        })
    })
  })
  describe('POST /{nomsId}/review-previous-unlawfully-at-large-periods', () => {
    it('should render the page with errors if validation fails', () => {
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '1',
          fromDate: '2020-01-01',
          toDate: '2020-01-03',
          days: 3,
          type: 'RECALL',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .post(`/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
        .send({})
        .type('form')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)

          const errors = $('[data-qa=error-summary]').find('li')
          expect(errors.length).toBe(1)
          expect(errors.eq(0).text().trim()).toStrictEqual(
            'Select the UAL that applies to the release date calculation',
          )

          const table = $('[data-qa=previous-ual-periods-table]')
          expect(table).toHaveLength(1)
          const rows = table.find('tbody tr')
          expect(rows).toHaveLength(1)
          expectRow(rows.eq(0), true, '1 January 2020', '3 January 2020', 'Brixton (HMP)', 'Recall', '3')
        })
    })

    it('should set the review with accepted and rejected types if some periods were selected and then redirect to review adjustments to apply', () => {
      return request(app)
        .post(`/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
        .send({
          selectedUalPeriod: ['selected1', 'selected2'],
          reviewedUalPeriod: ['selected2', 'notSelected', 'selected1'],
        })
        .type('form')
        .expect(302)
        .expect('Location', `/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .expect(_ => {
          expect(previousUnlawfullyAtLargeReviewStoreService.storeReview).toHaveBeenCalledWith(
            expect.anything(),
            NOMS_ID,
            {
              acceptedAdjustmentIds: ['selected1', 'selected2'],
              rejectedAdjustmentIds: ['notSelected'],
            } as PreviousUnlawfullyAtLargeReviewRequest,
          )
        })
    })

    it('should set the review with no accepted and and rejected adjustments if none was selected and then redirect to confirm none', () => {
      return request(app)
        .post(`/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
        .send({
          selectedUalPeriod: ['none'],
          reviewedUalPeriod: ['selected2', 'selected1'],
        })
        .type('form')
        .expect(302)
        .expect('Location', `/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .expect(_ => {
          expect(previousUnlawfullyAtLargeReviewStoreService.storeReview).toHaveBeenCalledWith(
            expect.anything(),
            NOMS_ID,
            {
              acceptedAdjustmentIds: [],
              rejectedAdjustmentIds: ['selected2', 'selected1'],
            } as PreviousUnlawfullyAtLargeReviewRequest,
          )
        })
    })
  })

  describe('GET /{nomsId}/review-unlawfully-at-large-to-apply', () => {
    it('Should have the correct navigation', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: ['1'],
        rejectedAdjustmentIds: [],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '1',
          fromDate: '2020-01-01',
          toDate: '2020-01-03',
          days: 3,
          type: 'RECALL',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .get(`/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toStrictEqual(
            `/${NOMS_ID}/review-previous-unlawfully-at-large-periods`,
          )
          expect($('[data-qa=cancel-button]').attr('href')).toStrictEqual(
            `/${NOMS_ID}/cancel-review-previous-unlawfully-at-large-periods`,
          )
        })
    })

    it('Should redirect to home if there are no previous periods of UAL for review', () => {
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([])
      return request(app)
        .get(`/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}`)
    })

    it('Should display a row for each selected previous period of UAL', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: ['1', '2', '3', '4', '5'],
        rejectedAdjustmentIds: [],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue(oneOfEveryTypeOfPreviousUal)
      return request(app)
        .get(`/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const table = $('[data-qa=previous-ual-periods-to-apply-table]')
          expect(table).toHaveLength(1)

          const rows = table.find('tbody tr')
          expect(rows).toHaveLength(6)
          expectRow(rows.eq(0), false, '1 January 2020', '3 January 2020', 'Brixton (HMP)', 'Recall', '3')
          expectRow(
            rows.eq(1),
            false,
            '1 February 2020',
            '4 February 2020',
            'Brixton (HMP)',
            'Escape, including absconds and ROTL failures',
            '4',
          )
          expectRow(rows.eq(2), false, '1 March 2020', '5 March 2020', 'Brixton (HMP)', 'Sentenced in absence', '5')
          expectRow(rows.eq(3), false, '1 April 2020', '6 April 2020', 'Brixton (HMP)', 'Release in error', '6')
          expectRow(rows.eq(4), false, '1 May 2020', '7 May 2020', 'Brixton (HMP)', 'Immigration detention', '7')
          expect(rows.eq(5).find('td').eq(4).text().trim()).toStrictEqual('25')
        })
    })

    it('should handle out of date review', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: ['1'],
        rejectedAdjustmentIds: ['3'],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '1',
          fromDate: '2020-01-01',
          toDate: '2020-01-03',
          days: 3,
          type: 'RECALL',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
        {
          id: '2',
          fromDate: '2020-02-01',
          toDate: '2020-02-04',
          days: 4,
          type: 'ESCAPE',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
        {
          id: '3',
          fromDate: '2020-03-01',
          toDate: '2020-03-05',
          days: 5,
          type: 'SENTENCED_IN_ABSENCE',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .get(`/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
    })

    it('should handle out of date review with same name of items but different ids', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: ['1'],
        rejectedAdjustmentIds: ['3'],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '1',
          fromDate: '2020-01-01',
          toDate: '2020-01-03',
          days: 3,
          type: 'RECALL',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
        {
          id: '2',
          fromDate: '2020-02-01',
          toDate: '2020-02-04',
          days: 4,
          type: 'ESCAPE',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .get(`/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
    })

    it('Should display a row for each selected previous period of UAL along with a total', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: ['1', '5'],
        rejectedAdjustmentIds: ['2', '3', '4'],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue(oneOfEveryTypeOfPreviousUal)
      return request(app)
        .get(`/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const table = $('[data-qa=previous-ual-periods-to-apply-table]')
          expect(table).toHaveLength(1)

          const rows = table.find('tbody tr')
          expect(rows).toHaveLength(3)
          expectRow(rows.eq(0), false, '1 January 2020', '3 January 2020', 'Brixton (HMP)', 'Recall', '3')
          expectRow(rows.eq(1), false, '1 May 2020', '7 May 2020', 'Brixton (HMP)', 'Immigration detention', '7')
          expect(rows.eq(2).find('td').eq(4).text().trim()).toStrictEqual('10') // '1' has 3 and '5' has 7 days
        })
    })
  })
  describe('POST /{nomsId}/review-unlawfully-at-large-to-apply', () => {
    it('should submit the review to the backend and redirect to home with a success banner', () => {
      const storedReview: PreviousUnlawfullyAtLargeReviewRequest = {
        acceptedAdjustmentIds: ['1', '2'],
        rejectedAdjustmentIds: ['3', '4', '5'],
      }
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue(storedReview)
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue(oneOfEveryTypeOfPreviousUal)
      adjustmentsService.submitPreviousUnlawfullyAtLargeReviewRequest.mockResolvedValue()

      const expectedMessage = {
        type: 'UNLAWFULLY_AT_LARGE',
        action: 'CREATE',
        days: 7, // 3 in '1' and 4 in '2'
      } as Message

      return request(app)
        .post(`/${NOMS_ID}/review-unlawfully-at-large-to-apply`)
        .send({})
        .type('form')
        .expect(302)
        .expect('Location', encodeURI(`/${NOMS_ID}/success?message=${JSON.stringify(expectedMessage)}`))
        .expect(_ => {
          expect(adjustmentsService.submitPreviousUnlawfullyAtLargeReviewRequest).toHaveBeenCalledWith(
            NOMS_ID,
            storedReview,
            user.username,
          )
          expect(previousUnlawfullyAtLargeReviewStoreService.clearReview).toHaveBeenCalled()
        })
    })
  })
  describe('GET /{nomsId}/confirm-inapplicable-unlawfully-at-large-periods', () => {
    it('Should have the correct navigation', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['1'],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '1',
          fromDate: '2020-01-01',
          toDate: '2020-01-03',
          days: 3,
          type: 'RECALL',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .get(`/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-back-link').attr('href')).toStrictEqual(
            `/${NOMS_ID}/review-previous-unlawfully-at-large-periods`,
          )
          expect($('[data-qa=cancel-button]').attr('href')).toStrictEqual(
            `/${NOMS_ID}/cancel-review-previous-unlawfully-at-large-periods`,
          )
        })
    })

    it('Should redirect to home if there are no previous periods of UAL for review', () => {
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([])
      return request(app)
        .get(`/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}`)
    })

    it('should handle out of date review', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['3'],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '1',
          fromDate: '2020-01-01',
          toDate: '2020-01-03',
          days: 3,
          type: 'RECALL',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
        {
          id: '2',
          fromDate: '2020-02-01',
          toDate: '2020-02-04',
          days: 4,
          type: 'ESCAPE',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
        {
          id: '3',
          fromDate: '2020-03-01',
          toDate: '2020-03-05',
          days: 5,
          type: 'SENTENCED_IN_ABSENCE',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .get(`/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
    })

    it('should handle out of date review with same name of items but different ids', () => {
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue({
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['3'],
      })
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue([
        {
          id: '2',
          fromDate: '2020-02-01',
          toDate: '2020-02-04',
          days: 4,
          type: 'ESCAPE',
          prisonName: 'Brixton (HMP)',
          prisonId: 'BXI',
        },
      ])
      return request(app)
        .get(`/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
    })
  })

  describe('POST /{nomsId}/confirm-inapplicable-unlawfully-at-large-periods', () => {
    it('should submit the review to the backend and redirect to home if yes is selected', () => {
      const storedReview: PreviousUnlawfullyAtLargeReviewRequest = {
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['1', '2', '3', '4', '5'],
      }
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue(storedReview)
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue(oneOfEveryTypeOfPreviousUal)
      adjustmentsService.submitPreviousUnlawfullyAtLargeReviewRequest.mockResolvedValue()

      return request(app)
        .post(`/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .send({ confirm: 'yes' })
        .type('form')
        .expect(302)
        .expect('Location', `/${NOMS_ID}`)
        .expect(_ => {
          expect(adjustmentsService.submitPreviousUnlawfullyAtLargeReviewRequest).toHaveBeenCalledWith(
            NOMS_ID,
            storedReview,
            user.username,
          )
          expect(previousUnlawfullyAtLargeReviewStoreService.clearReview).toHaveBeenCalled()
        })
    })

    it('should return to review the previous periods if no is selected', () => {
      const storedReview: PreviousUnlawfullyAtLargeReviewRequest = {
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['1', '2', '3', '4', '5'],
      }
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue(storedReview)
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue(oneOfEveryTypeOfPreviousUal)

      return request(app)
        .post(`/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .send({ confirm: 'no' })
        .type('form')
        .expect(302)
        .expect('Location', `/${NOMS_ID}/review-previous-unlawfully-at-large-periods`)
        .expect(_ => {
          expect(adjustmentsService.submitPreviousUnlawfullyAtLargeReviewRequest).not.toHaveBeenCalled()
          expect(previousUnlawfullyAtLargeReviewStoreService.clearReview).not.toHaveBeenCalled()
        })
    })

    it('should render the page with an error message if no option is selected', () => {
      const storedReview: PreviousUnlawfullyAtLargeReviewRequest = {
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['1', '2', '3', '4', '5'],
      }
      previousUnlawfullyAtLargeReviewStoreService.getReview.mockReturnValue(storedReview)
      adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview.mockResolvedValue(oneOfEveryTypeOfPreviousUal)

      return request(app)
        .post(`/${NOMS_ID}/confirm-inapplicable-unlawfully-at-large-periods`)
        .send({})
        .type('form')
        .expect(200)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const errors = $('[data-qa=error-summary]').find('li')
          expect(errors.length).toBe(1)
          expect(errors.eq(0).text().trim()).toStrictEqual('Select yes if you want to continue without applying UAL')
          expect(adjustmentsService.submitPreviousUnlawfullyAtLargeReviewRequest).not.toHaveBeenCalled()
          expect(previousUnlawfullyAtLargeReviewStoreService.clearReview).not.toHaveBeenCalled()
        })
    })
  })
  describe('GET /{nomsId}/cancel-review-previous-unlawfully-at-large-periods', () => {
    it('Should clear the session and redirect to home', () => {
      return request(app)
        .get(`/${NOMS_ID}/cancel-review-previous-unlawfully-at-large-periods`)
        .expect(302)
        .expect('Location', `/${NOMS_ID}`)
        .expect(_ => {
          expect(previousUnlawfullyAtLargeReviewStoreService.clearReview).toHaveBeenCalled()
        })
    })
  })

  function expectRow(
    row: cheerio.Cheerio<Element>,
    hasCheckBox: boolean,
    expectedFromDate: string,
    expectedToDate: string,
    expectedPrison: string,
    expectedType: string,
    expectedDays: string,
  ) {
    const index = hasCheckBox ? 1 : 0
    const rowCells = row.find('td')
    expect(
      rowCells
        .eq(index + 0)
        .text()
        .trim(),
    ).toStrictEqual(expectedFromDate)
    expect(
      rowCells
        .eq(index + 1)
        .text()
        .trim(),
    ).toStrictEqual(expectedToDate)
    expect(
      rowCells
        .eq(index + 2)
        .text()
        .trim(),
    ).toStrictEqual(expectedPrison)
    expect(
      rowCells
        .eq(index + 3)
        .text()
        .trim(),
    ).toStrictEqual(expectedType)
    expect(
      rowCells
        .eq(index + 4)
        .text()
        .trim(),
    ).toStrictEqual(expectedDays)
  }
})

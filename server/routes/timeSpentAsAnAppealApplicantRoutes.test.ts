import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import './testutils/toContainInOrder'
import SessionAdjustment from '../@types/AdjustmentTypes'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/adjustmentsStoreService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>

const NOMS_ID = 'ABC123'
const SESSION_ID = 'cc3c41bc-1ff9-4568-96e6-7c7de330f0c0'

const timeSpentAsAnAppealApplicantAdjustment = {
  id: '3',
  adjustmentType: 'APPEAL_APPLICANT',
  days: 19,
  timeSpentAsAnAppealApplicantNotToCount: { courtOfAppealReferenceNumber: 'COA12345' },
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
  prisonName: 'Leeds (HMP)',
} as Adjustment

const blankAdjustment = {
  person: NOMS_ID,
  bookingId: 12345,
  adjustmentType: 'APPEAL_APPLICANT',
  timeSpentAsAnAppealApplicantNotToCount: { courtOfAppealReferenceNumber: 'COA12345' },
  days: 21,
} as SessionAdjustment

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerService,
      adjustmentsService,
      adjustmentsStoreService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

describe('Time spent as an appeal applicant not to count routes', () => {
  it('GET /{nomsId}/appeal-applicant/add goes to the documentation page', () => {
    adjustmentsStoreService.store.mockReturnValue(SESSION_ID)
    return request(app)
      .get(`/${NOMS_ID}/appeal-applicant/add`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/appeal-applicant/days/add/${SESSION_ID}`)
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/appeal-applicant/days/:addOrEdit', async ({ addOrEdit }) => {
    adjustmentsStoreService.getById.mockReturnValue(timeSpentAsAnAppealApplicantAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/appeal-applicant/days/${addOrEdit}/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(
          'the number of days spent as an appeal applicant that will not count towards the sentence',
        )
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/appeal-applicant/days/:addOrEdit no number entered for days', async ({ addOrEdit }) => {
    return request(app)
      .post(`/${NOMS_ID}/appeal-applicant/days/${addOrEdit}/${SESSION_ID}`)
      .send()
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the number of days spent as an appeal applicant not to count')
      })
  })

  test.each`
    addOrEdit | days
    ${'add'}  | ${`0`}
    ${'add'}  | ${`-1`}
    ${'add'}  | ${`1.5`}
    ${'add'}  | ${`text`}
    ${'edit'} | ${`0`}
    ${'edit'} | ${`-1`}
    ${'edit'} | ${`1.5`}
    ${'edit'} | ${`text`}
  `('POST /{nomsId}/special remission/days/:addOrEdit invalid number entered for days', async ({ addOrEdit, days }) => {
    return request(app)
      .post(`/${NOMS_ID}/appeal-applicant/days/${addOrEdit}/${SESSION_ID}`)
      .send({ days })
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Enter a positive whole number for the number of days spent as an appeal applicant not to count',
        )
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/appeal-applicant/days/:addOrEdit a valid days input redirects to the reference input',
    async ({ addOrEdit }) => {
      return request(app)
        .post(`/${NOMS_ID}/appeal-applicant/days/${addOrEdit}/${SESSION_ID}`)
        .send({ days: 7 })
        .expect(302)
        .expect('Location', `/${NOMS_ID}/appeal-applicant/reference/${addOrEdit}/${SESSION_ID}`)
    },
  )

  it('GET /{nomsId}/appeal-applicant/days/edit to be pre populated with the existing reference number', async () => {
    adjustmentsStoreService.getById.mockReturnValue(timeSpentAsAnAppealApplicantAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/appeal-applicant/reference/edit/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('COA12345')
      })
  })

  test.each`
    addOrEdit | reference                                 | errorMessage
    ${'add'}  | ${''}                                     | ${'Enter a Court of Appeal reference number'}
    ${'edit'} | ${''}                                     | ${'Enter a Court of Appeal reference number'}
    ${'add'}  | ${'COA1234'}                              | ${'Enter a Court of Appeal reference number between 8 and 30 characters'}
    ${'edit'} | ${'COA1234'}                              | ${'Enter a Court of Appeal reference number between 8 and 30 characters'}
    ${'add'}  | ${'!@£$%^'}                               | ${'A Court of Appeal reference number should only contain letters and numbers'}
    ${'edit'} | ${'!@£$%^'}                               | ${'A Court of Appeal reference number should only contain letters and numbers'}
    ${'add'}  | ${'moreThan30CharactersShouldBeRejected'} | ${'Enter a Court of Appeal reference number between 8 and 30 characters'}
    ${'edit'} | ${'moreThan30CharactersShouldBeRejected'} | ${'Enter a Court of Appeal reference number between 8 and 30 characters'}
  `(
    'POST /{nomsId}/appeal-applicant/reference/:addOrEdit/ the reference number must be between 8 and 30 characters and no special characters',
    async ({ addOrEdit, reference, errorMessage }) => {
      adjustmentsStoreService.getById.mockReturnValue(timeSpentAsAnAppealApplicantAdjustment)
      return request(app)
        .post(`/${NOMS_ID}/appeal-applicant/reference/${addOrEdit}/${SESSION_ID}`)
        .send({ reference })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain(errorMessage)
        })
    },
  )

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/appeal-applicant/reference/:addOrEdit once the documentation is selected, the user is redirected to the review page',
    async ({ addOrEdit }) => {
      adjustmentsStoreService.getById.mockReturnValue(timeSpentAsAnAppealApplicantAdjustment)
      return request(app)
        .post(`/${NOMS_ID}/appeal-applicant/reference/${addOrEdit}/${SESSION_ID}`)
        .send({ reference: 'COA12345' })
        .expect(302)
        .expect('Location', `/${NOMS_ID}/appeal-applicant/review/${addOrEdit}/${SESSION_ID}`)
    },
  )

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/appeal-applicant/review/:addOrEdit displays the correct information', async ({ addOrEdit }) => {
    adjustmentsStoreService.getById.mockReturnValue(timeSpentAsAnAppealApplicantAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/appeal-applicant/review/${addOrEdit}/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('Time spent as an appeal applicant not to count details')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('19 days')
        expect(res.text).toContain('Court of Appeal reference number')
        expect(res.text).toContain('COA12345')
        expect(res.text).toContain(`ABC123/appeal-applicant/days/${addOrEdit}/${SESSION_ID}`)
        expect(res.text).toContain(`ABC123/appeal-applicant/reference/${addOrEdit}/${SESSION_ID}`)
      })
  })

  it('POST /{nomsId}/appeal-applicant/review/add creates with the correct message', () => {
    adjustmentsStoreService.getOnly.mockReturnValue(blankAdjustment)

    return request(app)
      .post(`/${NOMS_ID}/appeal-applicant/review/add/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22APPEAL_APPLICANT%22,%22days%22:21,%22action%22:%22CREATE%22%7D`,
      )
      .expect(() => {
        expect(adjustmentsService.create).toHaveBeenCalledWith(
          [
            {
              adjustmentType: 'APPEAL_APPLICANT',
              bookingId: 12345,
              days: 21,
              person: 'ABC123',
              timeSpentAsAnAppealApplicantNotToCount: { courtOfAppealReferenceNumber: 'COA12345' },
            },
          ],
          'user1',
        )
      })
  })

  it('POST /{nomsId}/appeal-applicant/review/add updates with the correct message', () => {
    adjustmentsStoreService.getOnly.mockReturnValue(timeSpentAsAnAppealApplicantAdjustment)

    return request(app)
      .post(`/${NOMS_ID}/appeal-applicant/review/edit/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22APPEAL_APPLICANT%22,%22days%22:19,%22action%22:%22UPDATE%22%7D`,
      )
      .expect(() => {
        expect(adjustmentsService.update).toHaveBeenCalledWith(
          '3',
          {
            adjustmentType: 'APPEAL_APPLICANT',
            bookingId: 12345,
            days: 19,
            id: '3',
            person: 'ABC123',
            prisonId: 'LDS',
            prisonName: 'Leeds (HMP)',
            sentenceSequence: null,
            timeSpentAsAnAppealApplicantNotToCount: { courtOfAppealReferenceNumber: 'COA12345' },
          },
          'user1',
        )
      })
  })

  test.each`
    route          | addOrEdit | backLink
    ${'days'}      | ${'add'}  | ${`/${NOMS_ID}" class="govuk-back-link"`}
    ${'days'}      | ${'edit'} | ${`/${NOMS_ID}/appeal-applicant/view" class="govuk-back-link"`}
    ${'reference'} | ${'add'}  | ${`/${NOMS_ID}/appeal-applicant/days/add/${SESSION_ID}" class="govuk-back-link"`}
    ${'reference'} | ${'edit'} | ${`/${NOMS_ID}/appeal-applicant/days/edit/${SESSION_ID}" class="govuk-back-link"`}
    ${'review'}    | ${'add'}  | ${`/${NOMS_ID}/appeal-applicant/reference/add/${SESSION_ID}" class="govuk-back-link"`}
    ${'review'}    | ${'edit'} | ${`/${NOMS_ID}/appeal-applicant/reference/edit/${SESSION_ID}" class="govuk-back-link"`}
  `('test back links', async ({ route, addOrEdit, backLink }) => {
    adjustmentsStoreService.getById.mockReturnValue(timeSpentAsAnAppealApplicantAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/appeal-applicant/${route}/${addOrEdit}/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(backLink)
      })
  })

  it('GET /{nomsId}/appeal-applicant/remove displays the correct information', () => {
    adjustmentsService.get.mockResolvedValue(timeSpentAsAnAppealApplicantAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/appeal-applicant/remove/${SESSION_ID}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Delete time spent as an appeal applicant not to count')
        expect(res.text).toContain('Time spent as an appeal applicant not to count details')
        expect(res.text).toContain('Entered by')
        expect(res.text).toContain('Leeds (HMP)')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('19')
        expect(res.text).toContain('Court of Appeal reference number')
        expect(res.text).toContain('COA12345')
        expect(res.text).toContain(`/${NOMS_ID}/appeal-applicant/view" class="govuk-back-link"`)
      })
  })

  it('POST /{nomsId}/appeal-applicant/remove returns to the hub with the remove message', () => {
    adjustmentsService.get.mockResolvedValue(timeSpentAsAnAppealApplicantAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/appeal-applicant/remove/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22APPEAL_APPLICANT%22,%22days%22:19,%22action%22:%22REMOVE%22%7D`,
      )
  })
})

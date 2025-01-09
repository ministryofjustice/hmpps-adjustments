import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import './testutils/toContainInOrder'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

jest.mock('../services/adjustmentsService')
jest.mock('../services/prisonerService')
jest.mock('../services/adjustmentsStoreService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>
const adjustmentsStoreService = new AdjustmentsStoreService() as jest.Mocked<AdjustmentsStoreService>

const NOMS_ID = 'ABC123'
const SESSION_ID = '96c83672-8499-4a64-abc9-3e031b1747b3'

const timeSpentInCustodyAbroadAdjustment = {
  id: '3',
  adjustmentType: 'CUSTODY_ABROAD',
  days: 31,
  timeSpentInCustodyAbroad: { documentationSource: 'PPCS_LETTER' },
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
  prisonName: 'Leeds (HMP)',
} as Adjustment

const blankAdjustment = {
  person: NOMS_ID,
  bookingId: 12345,
  adjustmentType: 'CUSTODY_ABROAD',
  timeSpentInCustodyAbroad: { documentationSource: 'PPCS_LETTER' },
  days: 13,
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

describe('Time spent in custody abroad routes', () => {
  it('GET /{nomsId}/custody-abroad/add goes to the documentation page', () => {
    adjustmentsStoreService.store.mockReturnValue(SESSION_ID)
    return request(app)
      .get(`/${NOMS_ID}/custody-abroad/add`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/custody-abroad/documentation/add/${SESSION_ID}`)
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/custody-abroad/documentation/:addOrEdit', async ({ addOrEdit }) => {
    adjustmentsStoreService.getById.mockReturnValue(timeSpentInCustodyAbroadAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/custody-abroad/documentation/${addOrEdit}/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(
          'Select the documentation that confirms time spent in custody abroad will count towards the sentence',
        )
        expect(res.text).toContain('Sentencing warrant from the court')
        expect(res.text).toContain('Letter from PPCS')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/custody-abroad/documentation/:addOrEdit/ if the radio is not selected then the error message is presented',
    async ({ addOrEdit }) => {
      adjustmentsStoreService.getById.mockReturnValue(timeSpentInCustodyAbroadAdjustment)
      return request(app)
        .post(`/${NOMS_ID}/custody-abroad/documentation/${addOrEdit}/${SESSION_ID}`)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('You must select an option')
          expect(res.text).toContain(
            'Select the documentation that confirms time spent in custody abroad will count towards the sentence',
          )
        })
    },
  )

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/custody-abroad/documentation/:addOrEdit once the documentation is selected, the user is redirected to the days page',
    async ({ addOrEdit }) => {
      adjustmentsStoreService.getById.mockReturnValue(timeSpentInCustodyAbroadAdjustment)
      return request(app)
        .post(`/${NOMS_ID}/custody-abroad/documentation/${addOrEdit}/${SESSION_ID}`)
        .send({ documentationSource: 'PPCS_LETTER' })
        .expect(302)
        .expect('Location', `/${NOMS_ID}/custody-abroad/days/${addOrEdit}/${SESSION_ID}`)
    },
  )

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
      .post(`/${NOMS_ID}/custody-abroad/days/${addOrEdit}/${SESSION_ID}`)
      .send({ days })
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          'Enter a positive whole number for the number of days of time spent in custody abroad',
        )
      })
  })
  //
  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/special remission/days/:addOrEdit invalid number entered for days', async ({ addOrEdit }) => {
    return request(app)
      .post(`/${NOMS_ID}/custody-abroad/days/${addOrEdit}/${SESSION_ID}`)
      .send()
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the number of days of time spent in custody abroad')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/special remission/days/:addOrEdit a valid days input redirects to type', async ({ addOrEdit }) => {
    return request(app)
      .post(`/${NOMS_ID}/custody-abroad/days/${addOrEdit}/${SESSION_ID}`)
      .send({ days: 7 })
      .expect(302)
      .expect('Location', `/${NOMS_ID}/custody-abroad/review/${addOrEdit}/${SESSION_ID}`)
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/custody-abroad/review/:addOrEdit displays the correct information', async ({ addOrEdit }) => {
    adjustmentsStoreService.getById.mockReturnValue(timeSpentInCustodyAbroadAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/custody-abroad/review/${addOrEdit}/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('Time spent in custody abroad details')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('31 days')
        expect(res.text).toContain('Documentation source')
        expect(res.text).toContain('Letter from PPCS')
        expect(res.text).toContain(`ABC123/custody-abroad/days/${addOrEdit}/96c83672-8499-4a64-abc9-3e031b1747b3`)
        expect(res.text).toContain(
          `ABC123/custody-abroad/documentation/${addOrEdit}/96c83672-8499-4a64-abc9-3e031b1747b3`,
        )
      })
  })

  it('POST /{nomsId}/custody-abroad/review/add creates with the correct message', () => {
    adjustmentsStoreService.getOnly.mockReturnValue(blankAdjustment)

    return request(app)
      .post(`/${NOMS_ID}/custody-abroad/review/add/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22CUSTODY_ABROAD%22,%22days%22:13,%22action%22:%22CREATE%22%7D`,
      )
      .expect(() => {
        expect(adjustmentsService.create).toHaveBeenCalledWith(
          [
            {
              adjustmentType: 'CUSTODY_ABROAD',
              bookingId: 12345,
              days: 13,
              person: 'ABC123',
              timeSpentInCustodyAbroad: { documentationSource: 'PPCS_LETTER' },
            },
          ],
          'user1',
        )
      })
  })

  test.each`
    route              | addOrEdit | backLink
    ${'documentation'} | ${'add'}  | ${`/${NOMS_ID}" class="govuk-back-link"`}
    ${'documentation'} | ${'edit'} | ${`/${NOMS_ID}/custody-abroad/view" class="govuk-back-link"`}
    ${'days'}          | ${'add'}  | ${`/${NOMS_ID}/custody-abroad/documentation/add/${SESSION_ID}" class="govuk-back-link"`}
    ${'days'}          | ${'edit'} | ${`/${NOMS_ID}/custody-abroad/documentation/edit/${SESSION_ID}" class="govuk-back-link"`}
    ${'review'}        | ${'add'}  | ${`/${NOMS_ID}/custody-abroad/days/add/${SESSION_ID}" class="govuk-back-link"`}
    ${'review'}        | ${'edit'} | ${`/${NOMS_ID}/custody-abroad/days/edit/${SESSION_ID}" class="govuk-back-link"`}
  `('test back links', async ({ route, addOrEdit, backLink }) => {
    adjustmentsStoreService.getById.mockReturnValue(timeSpentInCustodyAbroadAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/custody-abroad/${route}/${addOrEdit}/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(backLink)
      })
  })

  it('GET /{nomsId}/custody-abroad/remove displays the correct information', () => {
    adjustmentsService.get.mockResolvedValue(timeSpentInCustodyAbroadAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/custody-abroad/remove/${SESSION_ID}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Delete time spent in custody abroad')
        expect(res.text).toContain('Time spent in custody abroad details')
        expect(res.text).toContain('Entered by')
        expect(res.text).toContain('Leeds (HMP)')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('31')
        expect(res.text).toContain('Documentation Source')
        expect(res.text).toContain('Letter from PPCS')
        expect(res.text).toContain(`/${NOMS_ID}/custody-abroad/view" class="govuk-back-link"`)
      })
  })

  it('POST /{nomsId}/custody-abroad/remove returns to the hub with the remove message', () => {
    adjustmentsService.get.mockResolvedValue(timeSpentInCustodyAbroadAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/custody-abroad/remove/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22CUSTODY_ABROAD%22,%22days%22:31,%22action%22:%22REMOVE%22%7D`,
      )
  })
})

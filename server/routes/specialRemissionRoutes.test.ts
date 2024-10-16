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
const SESSION_ID = '873e5aae-c0d8-49f4-901f-33bc92f6d7c9'

const specialRemissionAdjustment = {
  id: '3',
  adjustmentType: 'SPECIAL_REMISSION',
  days: 27,
  specialRemission: { type: 'RELEASE_IN_ERROR' },
  person: 'ABC123',
  bookingId: 12345,
  sentenceSequence: null,
  prisonId: 'LDS',
  prisonName: 'Leeds (HMP)',
} as Adjustment

const blankAdjustment = {
  person: NOMS_ID,
  bookingId: 12345,
  adjustmentType: 'SPECIAL_REMISSION',
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
})

describe('Special remission routes', () => {
  it('GET /{nomsId}/special-remission/add goes to the check page', () => {
    adjustmentsStoreService.store.mockReturnValue(SESSION_ID)
    return request(app)
      .get(`/${NOMS_ID}/special-remission/add`)
      .expect(302)
      .expect('Location', `/${NOMS_ID}/special-remission/check/add/${SESSION_ID}`)
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/special-remission/check/:addOrEdit', async ({ addOrEdit }) => {
    return request(app)
      .get(`/${NOMS_ID}/special-remission/check/${addOrEdit}/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Has PPCS provided the number of special remission days?')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/special-remission/check/:addOrEdit/ if the radio is not selected then the error message is presented',
    async ({ addOrEdit }) => {
      return request(app)
        .post(`/${NOMS_ID}/special-remission/check/${addOrEdit}/${SESSION_ID}`)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Has PPCS provided the number of special remission days?')
          expect(res.text).toContain('You must select if PPCS have provided the number of special remission days')
        })
    },
  )

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/special-remission/check/:addOrEdit if no is selected you can not proceed with a special remission adjustment',
    async ({ addOrEdit }) => {
      return request(app)
        .post(`/${NOMS_ID}/special-remission/check/${addOrEdit}/${SESSION_ID}`)
        .send({ ppcsDays: 'no' })
        .expect(302)
        .expect('Location', `/${NOMS_ID}/special-remission/decline/${addOrEdit}/${SESSION_ID}`)
    },
  )
  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/special-remission/check/:addOrEdit if yes is selected, you are redirect to the days page',
    async ({ addOrEdit }) => {
      return request(app)
        .post(`/${NOMS_ID}/special-remission/check/${addOrEdit}/${SESSION_ID}`)
        .send({ ppcsDays: 'yes' })
        .expect(302)
        .expect('Location', `/${NOMS_ID}/special-remission/days/${addOrEdit}/${SESSION_ID}`)
    },
  )

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/special-remission/decline displays the correct reason', async ({ addOrEdit }) => {
    return request(app)
      .get(`/${NOMS_ID}/special-remission/decline/${addOrEdit}/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain(`href="/${NOMS_ID}/special-remission/check/${addOrEdit}/${SESSION_ID}`)
        expect(res.text).toContain('You cannot continue')
        expect(res.text).toContain('You need to ask PPCS for the number of special remission days')
        expect(res.text).toContain('Return to homepage')
        expect(res.text).toContain(`href="/${NOMS_ID}"`)
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
      .post(`/${NOMS_ID}/special-remission/days/${addOrEdit}/${SESSION_ID}`)
      .send({ days })
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter a positive whole number for the number of days of special remission')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/special remission/days/:addOrEdit invalid number entered for days', async ({ addOrEdit }) => {
    return request(app)
      .post(`/${NOMS_ID}/special-remission/days/${addOrEdit}/${SESSION_ID}`)
      .send()
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter the number of days of special remission')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/special remission/days/:addOrEdit a valid days input redirects to type', async ({ addOrEdit }) => {
    return request(app)
      .post(`/${NOMS_ID}/special-remission/days/${addOrEdit}/${SESSION_ID}`)
      .send({ days: 7 })
      .expect(302)
      .expect('Location', `/${NOMS_ID}/special-remission/type/${addOrEdit}/${SESSION_ID}`)
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/special-remission/type/:addOrEdit has the correct text on it', async ({ addOrEdit }) => {
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/special-remission/type/${addOrEdit}/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select the type of special remission')
        expect(res.text).toContain('Meritorious (excellent) conduct')
        expect(res.text).toContain(
          'The person has been rewarded with automatic release. or consideration for release by the Parole Board at an earlier date. If the person is on licence, their SLED is being brought forward.',
        )
        expect(res.text).toContain('Release date calculated too early')
        expect(res.text).toContain(
          'The balance of the sentence to be served to the correct release date has been cancelled out. The person will be released on an earlier date.',
        )
        expect(res.text).toContain('Release in error')
        expect(res.text).toContain('The person was released in error and they&#39;re not being returned to custody.')
        expect(res.text).toContain('You can read the rules for special remission in')
        expect(res.text).toContain(
          `<a href="https://assets.publishing.service.gov.uk/media/661fd299ced96304c8757e86/sentence-calculation-pf-annex-a-operational-guidance.pdf"`,
        )
      })
  })
  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('POST /{nomsId}/special-remission/type/:addOrEdit shows an error if not type selected', async ({ addOrEdit }) => {
    adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/special-remission/type/${addOrEdit}/${SESSION_ID}`)
      .send()
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You must select the type of special remission')
      })
  })

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `(
    'POST /{nomsId}/special-remission/type/:addOrEdit valid input directs to the review page',
    async ({ addOrEdit }) => {
      adjustmentsStoreService.getById.mockReturnValue(blankAdjustment)
      return request(app)
        .post(`/${NOMS_ID}/special-remission/type/${addOrEdit}/${SESSION_ID}`)
        .send({ specialRemissionType: 'MERITORIOUS_CONDUCT' })
        .expect(302)
        .expect('Location', `/${NOMS_ID}/special-remission/review/${addOrEdit}/${SESSION_ID}`)
    },
  )

  test.each`
    addOrEdit
    ${'add'}
    ${'edit'}
  `('GET /{nomsId}/special-remission/review/:addOrEdit displays the correct information', async ({ addOrEdit }) => {
    adjustmentsStoreService.getById.mockReturnValue(specialRemissionAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/special-remission/review/${addOrEdit}/${SESSION_ID}`)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Confirm and save')
        expect(res.text).toContain('Special remission details')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('27 days')
        expect(res.text).toContain('Type of special remission')
        expect(res.text).toContain('Release in error')
        expect(res.text).toContain(`ABC123/special-remission/days/${addOrEdit}/873e5aae-c0d8-49f4-901f-33bc92f6d7c9`)
        expect(res.text).toContain(`ABC123/special-remission/type/${addOrEdit}/873e5aae-c0d8-49f4-901f-33bc92f6d7c9`)
      })
  })

  it('POST /{nomsId}/special-remission/review/add creates with the correct message', () => {
    adjustmentsStoreService.getOnly.mockReturnValue(blankAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/special-remission/review/edit/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22SPECIAL_REMISSION%22,%22days%22:13,%22action%22:%22CREATE%22%7D`,
      )
  })
  it('POST /{nomsId}/special-remission/review/edit updates with the correct message', () => {
    adjustmentsStoreService.getOnly.mockReturnValue(specialRemissionAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/special-remission/review/edit/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22SPECIAL_REMISSION%22,%22days%22:27,%22action%22:%22UPDATE%22%7D`,
      )
  })

  test.each`
    route       | addOrEdit | backLink
    ${'check'}  | ${'add'}  | ${`/${NOMS_ID}" class="govuk-back-link"`}
    ${'check'}  | ${'edit'} | ${`/${NOMS_ID}/special-remission/view" class="govuk-back-link"`}
    ${'days'}   | ${'add'}  | ${`/${NOMS_ID}/special-remission/check/add/${SESSION_ID}" class="govuk-back-link"`}
    ${'days'}   | ${'edit'} | ${`/${NOMS_ID}/special-remission/check/edit/${SESSION_ID}" class="govuk-back-link"`}
    ${'type'}   | ${'add'}  | ${`/${NOMS_ID}/special-remission/days/add/${SESSION_ID}" class="govuk-back-link"`}
    ${'type'}   | ${'edit'} | ${`/${NOMS_ID}/special-remission/days/edit/${SESSION_ID}" class="govuk-back-link"`}
    ${'review'} | ${'add'}  | ${`/${NOMS_ID}/special-remission/type/add/${SESSION_ID}" class="govuk-back-link"`}
    ${'review'} | ${'edit'} | ${`/${NOMS_ID}/special-remission/type/edit/${SESSION_ID}" class="govuk-back-link"`}
  `('test back links', async ({ route, addOrEdit, backLink }) => {
    adjustmentsStoreService.getById.mockReturnValue(specialRemissionAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/special-remission/${route}/${addOrEdit}/${SESSION_ID}`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(backLink)
      })
  })
  it('GET /{nomsId}/special-remission/remove displays the correct information', () => {
    adjustmentsService.get.mockResolvedValue(specialRemissionAdjustment)
    return request(app)
      .get(`/${NOMS_ID}/special-remission/remove/${SESSION_ID}`)
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Delete special remission')
        expect(res.text).toContain('Special remission details')
        expect(res.text).toContain('Entered by')
        expect(res.text).toContain('Leeds (HMP)')
        expect(res.text).toContain('Number of days')
        expect(res.text).toContain('27')
        expect(res.text).toContain('Type')
        expect(res.text).toContain('Release in error')
        expect(res.text).toContain(`/${NOMS_ID}/special-remission/view" class="govuk-back-link"`)
      })
  })
  it('POST /{nomsId}/special-remission/remove returns to the hub with the remove message', () => {
    adjustmentsService.get.mockResolvedValue(specialRemissionAdjustment)
    return request(app)
      .post(`/${NOMS_ID}/special-remission/remove/${SESSION_ID}`)
      .expect(302)
      .expect(
        'Location',
        `/${NOMS_ID}/success?message=%7B%22type%22:%22SPECIAL_REMISSION%22,%22days%22:27,%22action%22:%22REMOVE%22%7D`,
      )
  })
})

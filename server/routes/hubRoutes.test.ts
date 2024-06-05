import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'

jest.mock('../services/prisonerService')
jest.mock('../services/adjustmentsService')

const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
const adjustmentsService = new AdjustmentsService(null) as jest.Mocked<AdjustmentsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({ services: { prisonerService, adjustmentsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /:nomsId', () => {
  it('should render prisoner details', () => {
    prisonerService.getStartOfSentenceEnvelope.mockResolvedValue({
      earliestSentence: new Date(),
      earliestExcludingRecalls: new Date(),
    })
    adjustmentsService.findByPerson.mockResolvedValue([])
    return request(app)
      .get('/ABC123')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('data-qa="mini-profile-prisoner-number">ABC123')
        expect(res.text).toContain('mini-profile-status">Life imprisonment<')
      })
  })
})

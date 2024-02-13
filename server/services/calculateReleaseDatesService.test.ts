import nock from 'nock'
import config from '../config'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

jest.mock('../data/hmppsAuthClient')

const token = 'token'
const NOMS_ID = 'A1234AB'

const populatedAdjustment = {
  id: '1',
  bookingId: 1,
  person: NOMS_ID,
  adjustmentType: 'TAGGED_BAIL',
  days: 9955,
  taggedBail: { caseSequence: 1 },
  remand: { chargeId: [1] },
} as Adjustment

const populatedSessionAdjustment = {
  ...populatedAdjustment,
  completed: false,
} as SessionAdjustment

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

describe('Prisoner service related tests', () => {
  let calculateReleaseDateService: CalculateReleaseDatesService
  let fakeApi: nock.Scope
  let unusedDeductionCalculationResponse: UnusedDeductionCalculationResponse
  let id: string
  beforeEach(() => {
    config.apis.calculateReleaseDates.url = 'http://localhost:8089'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
    calculateReleaseDateService = new CalculateReleaseDatesService()
    unusedDeductionCalculationResponse = { unusedDeductions: 50, validationMessages: [] }
    id = '1'
  })
  afterEach(() => {
    nock.cleanAll()
  })

  describe('calculateReleaseDateService', () => {
    describe('unusedDeductionsHandlingCRDError', () => {
      it('Test getting getting unused deductions', async () => {
        fakeApi
          .post(`/unused-deductions/${NOMS_ID}/calculation`, () => true)
          .reply(200, unusedDeductionCalculationResponse)

        const result = await calculateReleaseDateService.unusedDeductionsHandlingCRDError(
          { [id]: populatedSessionAdjustment },
          [populatedAdjustment],
          stubbedSentencesAndOffences,
          NOMS_ID,
          token,
        )

        expect(result).toEqual(unusedDeductionCalculationResponse)
      })

      it('Test error handling', async () => {
        fakeApi.post(`/unused-deductions/${NOMS_ID}/calculation`, () => true).reply(500, null)

        const result = await calculateReleaseDateService.unusedDeductionsHandlingCRDError(
          { [id]: populatedSessionAdjustment },
          [populatedAdjustment],
          stubbedSentencesAndOffences,
          NOMS_ID,
          token,
        )

        expect(result).toEqual(null)
      })
    })
  })
})

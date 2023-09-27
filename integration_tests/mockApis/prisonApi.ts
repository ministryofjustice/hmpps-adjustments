import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetPrisonerDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offenders/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          offenderNo: 'A1234AB',
          bookingId: '1234',
          firstName: 'Marvin',
          lastName: 'Haggler',
          dateOfBirth: '1965-02-03',
          agencyId: 'MDI',
        },
      },
    })
  },
  stubGetUserCaseloads: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/users/me/caseLoads',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            caseLoadId: 'MDI',
          },
        ],
      },
    })
  },
  stubGetSentencesAndOffences: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offender-sentences/booking/1234/sentences-and-offences',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            terms: [
              {
                years: 3,
              },
            ],
            sentenceCalculationType: 'ADIMP',
            sentenceTypeDescription: 'SDS Standard Sentence',
            caseSequence: 1,
            lineSequence: 1,
            caseReference: 'ABC123',
            sentenceSequence: 1,
            sentenceStatus: 'A',
            offences: [
              {
                offenceEndDate: '2021-02-03',
                offenceCode: 'abc',
                offenderChargeId: 111,
                offenceDescription: 'Doing a crime',
              },
            ],
          },
        ],
      },
    })
  },
}

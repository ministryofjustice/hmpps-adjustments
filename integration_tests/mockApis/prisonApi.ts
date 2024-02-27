import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { adjudications, adjudicationsNoReview, adjudicationsSearch, adjudicationsSearchNoReview } from './adjudications'

export default {
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
            sentenceDate: '2001-01-01',
            offences: [
              {
                offenceEndDate: '2000-02-03',
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
  stubSearchAdjudicationsNoReview: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offenders/A1234AB/adjudications',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: adjudicationsSearchNoReview,
      },
    })
  },
  stubSearchAdjudications: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offenders/A1234AB/adjudications',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: adjudicationsSearch,
      },
    })
  },
  sstubSearchAdjudicationsNoResults: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offenders/A1234AB/adjudications',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          results: [],
        },
      },
    })
  },
  stubIndividualAdjudicationsNoReview: (): Promise<unknown> => {
    return Promise.all(
      adjudicationsNoReview.map(it => {
        return stubFor({
          request: {
            method: 'GET',
            urlPattern: `/prison-api/api/offenders/A1234AB/adjudications/${it.adjudicationNumber}`,
          },
          response: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            jsonBody: it,
          },
        })
      }),
    )
  },
  stubIndividualAdjudications: (): Promise<unknown> => {
    return Promise.all(
      adjudications.map(it => {
        return stubFor({
          request: {
            method: 'GET',
            urlPattern: `/prison-api/api/offenders/A1234AB/adjudications/${it.adjudicationNumber}`,
          },
          response: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            jsonBody: it,
          },
        })
      }),
    )
  },
}

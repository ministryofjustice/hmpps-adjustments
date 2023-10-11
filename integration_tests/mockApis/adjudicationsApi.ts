import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import { adjudications, adjudicationsNoReview, adjudicationsSearch, adjudicationsSearchNoReview } from './adjudications'

export default {
  stubSearchAdjudicationsNoReview: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjudications-api/adjudications/A1234AB/adjudications\\?size=1000',
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
        urlPattern: '/adjudications-api/adjudications/A1234AB/adjudications\\?size=1000',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: adjudicationsSearch,
      },
    })
  },
  stubIndividualAdjudicationsNoReview: (): Promise<unknown> => {
    return Promise.all(
      adjudicationsNoReview.map(it => {
        return stubFor({
          request: {
            method: 'GET',
            urlPattern: `/adjudications-api/adjudications/A1234AB/charge/${it.adjudicationNumber}`,
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
            urlPattern: `/adjudications-api/adjudications/A1234AB/charge/${it.adjudicationNumber}`,
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

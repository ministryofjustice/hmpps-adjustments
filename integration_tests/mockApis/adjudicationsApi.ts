import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubEmptySearchAdjudications: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjudications-api/adjudications/A1234AB/adjudications\\?size=1000',
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
}

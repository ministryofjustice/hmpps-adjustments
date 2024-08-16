import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubCalculateUnusedDeductionsNoUnused: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/calculate-release-dates-api/unused-deductions/A1234AB/calculation(.*)',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            unusedDeductions: 0,
            validationMessages: 'NOMIS',
          },
        ],
      },
    })
  },
  stubCalculateUnusedDeductionsSomeUnused: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/calculate-release-dates-api/unused-deductions/A1234AB/calculation(.*)',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            unusedDeductions: 20,
            validationMessages: 'NOMIS',
          },
        ],
      },
    })
  },
}

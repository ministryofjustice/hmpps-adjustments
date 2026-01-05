import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetSentenceTypeAndItsDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/ras-api/legacy/sentence-type/all/summary',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            nomisSentenceTypeReference: 'ADIMP_ORA',
            recall: {
              isRecall: false,
              type: 'NONE',
              isFixedTermRecall: false,
              lengthInDays: 0,
            },
            nomisDescription: 'CJA03 Standard Determinate Sentence',
            isIndeterminate: false,
            nomisActive: true,
            nomisExpiryDate: null,
          },
          {
            nomisSentenceTypeReference: 'ADIMP',
            recall: {
              isRecall: false,
              type: 'NONE',
              isFixedTermRecall: false,
              lengthInDays: 0,
            },
            nomisDescription: 'CJA03 Standard Determinate Sentence',
            isIndeterminate: false,
            nomisActive: true,
            nomisExpiryDate: null,
          },
        ],
      },
    })
  },
}

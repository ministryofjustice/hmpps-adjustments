import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetAdjustments: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments\\?person=A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            id: '5d2b87ee-02de-4ec7-b0ed-d3113a213136',
            adjustment: {
              bookingId: 1204935,
              sentenceSequence: 1,
              person: 'A1032DZ',
              adjustmentType: 'REMAND',
              toDate: '2023-01-20',
              fromDate: '2023-01-10',
              days: 11,
            },
          },
          {
            id: '5c618eb1-dcc9-4959-827e-27e6cd5fedf6',
            adjustment: {
              bookingId: 1204935,
              sentenceSequence: null,
              person: 'A1032DZ',
              adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
              toDate: null,
              fromDate: '2023-06-01',
              days: 40,
            },
          },
          {
            id: '4c3c057c-896d-4793-9022-f3001e209a36',
            adjustment: {
              bookingId: 1204935,
              sentenceSequence: null,
              person: 'A1032DZ',
              adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
              toDate: null,
              fromDate: '2023-03-30',
              days: 22,
            },
          },
        ],
      },
    })
  },
  stubValidateAdjustmentWithWarning: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/adjustments-api/adjustments/validate',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            code: 'RADA_REDUCES_BY_MORE_THAN_HALF',
            arguments: [],
            message: 'Are you sure, as this reduction is more than 50% of the total additional days awarded?',
            type: 'WARNING',
          },
        ],
      },
    })
  },
  stubValidateAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/adjustments-api/adjustments/validate',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [],
      },
    })
  },
  stubCreateAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/adjustments-api/adjustments',
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
}

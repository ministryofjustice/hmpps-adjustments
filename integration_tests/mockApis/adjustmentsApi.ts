import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetAdjustments: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments\\?person=A1234AB(.*)',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            id: '5d2b87ee-02de-4ec7-b0ed-d3113a213136',
            bookingId: 1204935,
            sentenceSequence: 1,
            person: 'A1234AB',
            adjustmentType: 'REMAND',
            toDate: '2023-01-20',
            fromDate: '2023-01-10',
            days: 11,
            prisonName: 'Leeds',
          },
          {
            id: '5c618eb1-dcc9-4959-827e-27e6cd5fedf6',
            person: 'A1234AB',
            bookingId: 1204935,
            adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
            fromDate: '2016-05-12',
            days: 40,
            prisonId: 'KMI',
            prisonName: 'Leeds',
            additionalDaysAwarded: { adjudicationId: [1296861, 1296857, 1296855, 1296846, 1296839] },
          },
          {
            id: '4c3c057c-896d-4793-9022-f3001e209a36',
            bookingId: 1204935,
            sentenceSequence: null,
            person: 'A1234AB',
            adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
            toDate: null,
            fromDate: '2023-03-30',
            days: 22,
            prisonName: 'Leeds',
          },
          {
            id: '4c3c057c-896d-4793-9022-f3001e209a36',
            bookingId: 1204935,
            sentenceSequence: 2,
            person: 'A1234AB',
            adjustmentType: 'TAGGED_BAIL',
            toDate: null,
            fromDate: '2023-03-30',
            days: 22,
            prisonName: 'Leeds',
            taggedBail: { caseSequence: 2 },
          },
        ],
      },
    })
  },
  stubGetAdjustmentsNoAdas: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments\\?person=A1234AB(.*)',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            id: '5d2b87ee-02de-4ec7-b0ed-d3113a213136',
            bookingId: 1204935,
            sentenceSequence: 1,
            person: 'A1234AB',
            adjustmentType: 'REMAND',
            toDate: '2023-01-20',
            fromDate: '2023-01-10',
            days: 11,
          },
          {
            id: '4c3c057c-896d-4793-9022-f3001e209a36',
            bookingId: 1204935,
            sentenceSequence: null,
            person: 'A1234AB',
            adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
            toDate: null,
            fromDate: '2023-03-30',
            days: 22,
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
        jsonBody: { adjustmentId: '4c3c057c-896d-4793-9022-f3001e209a36' },
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetRadaAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/4c3c057c-896d-4793-9022-f3001e209a36',
      },
      response: {
        jsonBody: {
          id: '4c3c057c-896d-4793-9022-f3001e209a36',
          adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
          bookingId: '1234',
          fromDate: '2023-04-05',
          toDate: null,
          person: 'A1234AB',
          days: 25,
          sentenceSequence: null,
        },
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetTaggedBailAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/4c3c057c-896d-4793-9022-f3001e209a36',
      },
      response: {
        jsonBody: {
          id: '4c3c057c-896d-4793-9022-f3001e209a36',
          adjustmentType: 'TAGGED_BAIL',
          bookingId: '1234',
          fromDate: '2023-04-05',
          toDate: null,
          person: 'A1234AB',
          days: 25,
          sentenceSequence: 2,
          taggedBail: { caseSequence: 2 },
        },
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetRemandAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/5d2b87ee-02de-4ec7-b0ed-d3113a213136',
      },
      response: {
        jsonBody: {
          id: '5d2b87ee-02de-4ec7-b0ed-d3113a213136',
          bookingId: 1204935,
          sentenceSequence: 1,
          person: 'A1234AB',
          adjustmentType: 'REMAND',
          toDate: '2023-01-20',
          fromDate: '2023-01-10',
          days: 11,
          prisonName: 'Leeds',
        },
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubUpdateAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/adjustments-api/adjustments/4c3c057c-896d-4793-9022-f3001e209a36',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubUpdateRemandAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/adjustments-api/adjustments/5d2b87ee-02de-4ec7-b0ed-d3113a213136',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteTaggedBailAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/adjustments-api/adjustments/4c3c057c-896d-4793-9022-f3001e209a36',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteRemandAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/adjustments-api/adjustments/5d2b87ee-02de-4ec7-b0ed-d3113a213136',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteRada: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/adjustments-api/adjustments/4c3c057c-896d-4793-9022-f3001e209a36',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteAda: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/adjustments-api/adjustments/5c618eb1-dcc9-4959-827e-27e6cd5fedf6',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  subAdaDetailsNoIntercept: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/additional-days/A1234AB/adjudication-details.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          awaitingApproval: [],
          suspended: [],
          quashed: [],
          awarded: [],
          prospective: [],
          totalProspective: 0,
          totalAwarded: 0,
          totalQuashed: 0,
          totalAwaitingApproval: 0,
          totalSuspended: 0,
          intercept: {
            number: 0,
            type: 'NONE',
            anyProspective: false,
          },
          showExistingAdaMessage: false,
          totalExistingAdas: 0,
        },
      },
    })
  },
}

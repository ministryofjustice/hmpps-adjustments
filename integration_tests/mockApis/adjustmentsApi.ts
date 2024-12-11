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
            source: 'DPS',
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
            source: 'DPS',
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
            source: 'DPS',
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
            source: 'DPS',
          },
          {
            id: 'e626a0e7-5eae-4ced-a10d-8e3bce9c522c',
            bookingId: 1204935,
            sentenceSequence: 2,
            person: 'A1234AB',
            adjustmentType: 'LAWFULLY_AT_LARGE',
            fromDate: '2023-03-30',
            toDate: '2023-04-17',
            lawfullyAtLarge: { affectsDates: 'YES' },
            prisonName: 'Leeds',
            source: 'DPS',
          },
          {
            id: 'ual-626a0e7-5eae-4ced-a10d-8e3bce9c522c',
            adjustmentType: 'UNLAWFULLY_AT_LARGE',
            toDate: '2024-02-23',
            fromDate: '2024-03-23',
            unlawfullyAtLarge: { type: 'RECALL' },
            person: 'A1234AB',
            bookingId: 12345,
            sentenceSequence: null,
            prisonId: 'LDS',
            days: 30,
          },
          {
            id: '8f390784-1bd2-4bb8-8e91-9d487c8e8b28',
            bookingId: 1204935,
            sentenceSequence: 2,
            person: 'A1234AB',
            adjustmentType: 'SPECIAL_REMISSION',
            fromDate: '2023-03-30',
            days: 123,
            specialRemission: { type: 'MERITORIOUS_CONDUCT' },
            prisonName: 'Leeds',
            source: 'DPS',
          },
        ],
      },
    })
  },
  stubGetAdjustmentsWithUnused: (): SuperAgentRequest => {
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
            id: '5d2b87ee-02de-4ec7-b0ed-d3113a213136',
            bookingId: 1204935,
            sentenceSequence: 1,
            person: 'A1234AB',
            adjustmentType: 'UNUSED_DEDUCTIONS',
            toDate: '2023-01-20',
            fromDate: '2023-01-10',
            days: 11,
            effectiveDays: 11,
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
  stubGetUalAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/ual-626a0e7-5eae-4ced-a10d-8e3bce9c522c',
      },
      response: {
        jsonBody: {
          id: 'ual-626a0e7-5eae-4ced-a10d-8e3bce9c522c',
          adjustmentType: 'UNLAWFULLY_AT_LARGE',
          toDate: '2024-02-23',
          fromDate: '2024-03-23',
          unlawfullyAtLarge: { type: 'RECALL' },
          person: 'A1234AB',
          bookingId: 12345,
          sentenceSequence: null,
          prisonId: 'LDS',
          days: 30,
        },
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetLalAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/e626a0e7-5eae-4ced-a10d-8e3bce9c522c',
      },
      response: {
        jsonBody: {
          id: 'e626a0e7-5eae-4ced-a10d-8e3bce9c522c',
          adjustmentType: 'LAWFULLY_AT_LARGE',
          bookingId: '1234',
          fromDate: '2023-03-30',
          toDate: '2023-04-17',
          days: 18,
          lawfullyAtLarge: { affectsDates: 'YES' },
          person: 'A1234AB',
        },
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubGetSpecialRemissionAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/8f390784-1bd2-4bb8-8e91-9d487c8e8b28',
      },
      response: {
        jsonBody: {
          id: '8f390784-1bd2-4bb8-8e91-9d487c8e8b28',
          adjustmentType: 'SPECIAL_REMISSION',
          bookingId: '1234',
          fromDate: '2023-03-30',
          toDate: '2023-04-17',
          days: 42,
          specialRemission: { type: 'MERITORIOUS_CONDUCT' },
          person: 'A1234AB',
        },
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteSpecialRemissionAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/adjustments-api/adjustments/8f390784-1bd2-4bb8-8e91-9d487c8e8b28',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubUpdateSpecialRemissionAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/adjustments-api/adjustments/8f390784-1bd2-4bb8-8e91-9d487c8e8b28',
      },
      response: {
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
  stubUpdateLalAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/adjustments-api/adjustments/e626a0e7-5eae-4ced-a10d-8e3bce9c522c',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubUpdateUalAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/adjustments-api/adjustments/ual-626a0e7-5eae-4ced-a10d-8e3bce9c522c',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteUalAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/adjustments-api/adjustments/ual-626a0e7-5eae-4ced-a10d-8e3bce9c522c',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteLalAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/adjustments-api/adjustments/e626a0e7-5eae-4ced-a10d-8e3bce9c522c',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },
  stubDeleteAdjustment: (): SuperAgentRequest => {
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
  stubUpdateRemandAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/adjustments-api/adjustments/.*',
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
  subAdaDetailsForIntercept: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/additional-days/A1234AB/adjudication-details.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          totalAwarded: 0,
          awarded: [],
          totalSuspended: 0,
          suspended: [],
          awaitingApproval: [
            {
              dateChargeProved: '2014-11-24',
              charges: [
                {
                  dateChargeProved: '2014-11-24',
                  chargeNumber: 998947,
                  heardAt: 'Doncaster (HMP)',
                  status: 'AWARDED_OR_PENDING',
                  days: 21,
                  sequence: 9,
                  toBeServed: 'Concurrent',
                },
                {
                  dateChargeProved: '2014-11-24',
                  chargeNumber: 998946,
                  heardAt: 'Doncaster (HMP)',
                  status: 'AWARDED_OR_PENDING',
                  days: 21,
                  sequence: 8,
                  toBeServed: 'Concurrent',
                },
              ],
              total: 21,
              status: 'PENDING APPROVAL',
            },
            {
              dateChargeProved: '2017-01-19',
              charges: [
                {
                  dateChargeProved: '2017-01-19',
                  chargeNumber: 1468919,
                  heardAt: 'Kirkham (HMP)',
                  status: 'PROSPECTIVE',
                  days: 10,
                  sequence: 13,
                  toBeServed: 'Forthwith',
                },
              ],
              total: 10,
              status: 'PENDING APPROVAL',
            },
          ],
          totalAwaitingApproval: 31,
          quashed: [],
          totalQuashed: 0,
          intercept: {
            type: 'UPDATE',
            number: 2,
            anyProspective: true,
          },
          prospective: [
            {
              dateChargeProved: '2000-07-25',
              charges: [
                {
                  dateChargeProved: '2000-07-25',
                  chargeNumber: 104841,
                  heardAt: 'Preston (HMP)',
                  status: 'PROSPECTIVE',
                  days: 7,
                  sequence: 6,
                  toBeServed: 'Forthwith',
                },
              ],
              total: 7,
              status: 'PENDING APPROVAL',
            },
            {
              dateChargeProved: '2017-01-19',
              charges: [
                {
                  dateChargeProved: '2017-01-19',
                  chargeNumber: 1468919,
                  heardAt: 'Kirkham (HMP)',
                  status: 'PROSPECTIVE',
                  days: 10,
                  sequence: 13,
                  toBeServed: 'Forthwith',
                },
              ],
              total: 10,
              status: 'PENDING APPROVAL',
            },
          ],
          totalProspective: 17,
          showExistingAdaMessage: false,
          totalExistingAdas: 40,
        },
      },
    })
  },
  stubRejectProspectiveAda: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/adjustments-api/adjustments/additional-days/A1234AB/reject-prospective-ada',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {},
      },
    })
  },
  stubGetUnusedDeductionsCalculationResult: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/person/A1234AB/unused-deductions-result',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          calculatedAt: '2024-01-01',
          status: 'CALCULATED',
        },
      },
    })
  },
  stubGetUnusedDeductionsCalculationResultUnsupported: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/person/A1234AB/unused-deductions-result',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          calculatedAt: '2024-01-01',
          status: 'UNSUPPORTED',
        },
      },
    })
  },
  stubGetUnusedDeductionsCalculationResultUnsupportedEdit: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/person/A1234AB/unused-deductions-result',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          calculatedAt: '2024-01-01',
          days: 11,
          status: 'UNSUPPORTED',
        },
      },
    })
  },
  stubGetUnusedDeductionsCalculationResultNomisAdjustment: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjustments-api/adjustments/person/A1234AB/unused-deductions-result',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          calculatedAt: '2024-01-01',
          days: 11,
          status: 'NOMIS_ADJUSTMENT',
        },
      },
    })
  },
  stubSetUnusedDaysManually: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/adjustments-api/adjustments/person/A1234AB/manual-unused-deductions',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            days: 10,
          },
        ],
      },
    })
  },
}

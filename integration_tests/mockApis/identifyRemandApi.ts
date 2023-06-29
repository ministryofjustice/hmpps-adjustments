import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetRelevantRemand: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/identify-remand-api/relevant-remand/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          chargeRemand: [
            {
              from: '2022-11-23',
              to: '2022-12-15',
              charge: {
                chargeId: 3933924,
                offence: {
                  code: 'TP47017',
                  statute: 'TP47',
                  description: 'Accidentally allow a chimney to be on fire',
                },
                offenceDate: '2023-02-01',
                bookingId: 1204935,
                offenceEndDate: null,
                sentenceSequence: null,
                sentenceDate: null,
                courtCaseRef: 'CASE5678',
                courtLocation: 'Birmingham Crown Court',
                resultDescription: 'Commit to Crown Court for Trial (Summary / Either Way Offences)',
              },
              days: 23,
            },
            {
              from: '2023-01-10',
              to: '2023-01-20',
              charge: {
                chargeId: 3933870,
                offence: { code: 'WR91001', statute: 'WR91', description: 'Abstract water without a licence' },
                offenceDate: '2022-01-10',
                bookingId: 1204935,
                offenceEndDate: null,
                sentenceSequence: 1,
                sentenceDate: '2023-03-21',
                courtCaseRef: 'CASE1234',
                courtLocation: 'Birmingham Crown Court',
                resultDescription: 'Imprisonment',
              },
              days: 11,
            },
            {
              from: '2023-02-01',
              to: '2023-03-20',
              charge: {
                chargeId: 3933870,
                offence: { code: 'WR91001', statute: 'WR91', description: 'Abstract water without a licence' },
                offenceDate: '2022-01-10',
                bookingId: 1204935,
                offenceEndDate: null,
                sentenceSequence: 1,
                sentenceDate: '2023-03-21',
                courtCaseRef: 'CASE1234',
                courtLocation: 'Birmingham Crown Court',
                resultDescription: 'Imprisonment',
              },
              days: 48,
            },
          ],
          sentenceRemand: [
            {
              from: '2023-01-10',
              to: '2023-01-20',
              charge: {
                chargeId: 3933870,
                offence: { code: 'WR91001', statute: 'WR91', description: 'Abstract water without a licence' },
                offenceDate: '2022-01-10',
                bookingId: 1204935,
                offenceEndDate: null,
                sentenceSequence: 1,
                sentenceDate: '2023-03-21',
                courtCaseRef: 'CASE1234',
                courtLocation: 'Birmingham Crown Court',
                resultDescription: 'Imprisonment',
              },
              days: 11,
            },
            {
              from: '2023-02-01',
              to: '2023-03-20',
              charge: {
                chargeId: 3933870,
                offence: { code: 'WR91001', statute: 'WR91', description: 'Abstract water without a licence' },
                offenceDate: '2022-01-10',
                bookingId: 1204935,
                offenceEndDate: null,
                sentenceSequence: 1,
                sentenceDate: '2023-03-21',
                courtCaseRef: 'CASE1234',
                courtLocation: 'Birmingham Crown Court',
                resultDescription: 'Imprisonment',
              },
              days: 48,
            },
          ],
          intersectingSentences: [],
        },
      },
    })
  },
}

import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'
import adjudications from './adjudications'

export default {
  stubSearchAdjudications: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/adjudications-api/adjudications/A1234AB/adjudications\\?size=1000',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          results: {
            content: [
              {
                adjudicationNumber: 1296861,
                reportTime: '2016-04-16T13:21:00',
                agencyIncidentId: 1278212,
                agencyId: 'HVI',
                partySeq: 1,
                adjudicationCharges: [
                  {
                    oicChargeId: '1296861/1',
                    offenceCode: '51:1',
                    offenceDescription: 'Commits any assault',
                    findingCode: 'PROVED',
                  },
                ],
              },
              {
                adjudicationNumber: 1296857,
                reportTime: '2016-04-16T13:13:00',
                agencyIncidentId: 1278208,
                agencyId: 'HVI',
                partySeq: 1,
                adjudicationCharges: [
                  {
                    oicChargeId: '1296857/1',
                    offenceCode: '51:22',
                    offenceDescription: 'Disobeys any lawful order',
                    findingCode: 'PROVED',
                  },
                ],
              },
              {
                adjudicationNumber: 1296855,
                reportTime: '2016-04-16T13:01:00',
                agencyIncidentId: 1278206,
                agencyId: 'HVI',
                partySeq: 1,
                adjudicationCharges: [
                  {
                    oicChargeId: '1296855/1',
                    offenceCode: '51:1',
                    offenceDescription: 'Commits any assault',
                    findingCode: 'PROVED',
                  },
                ],
              },
              {
                adjudicationNumber: 1296846,
                reportTime: '2016-04-16T12:50:00',
                agencyIncidentId: 1278197,
                agencyId: 'HVI',
                partySeq: 1,
                adjudicationCharges: [
                  {
                    oicChargeId: '1296846/1',
                    offenceCode: '51:1',
                    offenceDescription: 'Commits any assault',
                    findingCode: 'PROVED',
                  },
                ],
              },
              {
                adjudicationNumber: 1296839,
                reportTime: '2016-04-16T12:40:00',
                agencyIncidentId: 1278189,
                agencyId: 'HVI',
                partySeq: 1,
                adjudicationCharges: [
                  {
                    oicChargeId: '1296839/1',
                    offenceCode: '51:5',
                    offenceDescription:
                      'Intentionally endangers the health or personal safety of others or, by his conduct, is reckless whether such health or personal safety is endangered',
                    findingCode: 'PROVED',
                  },
                ],
              },
            ],
            pageable: {
              pageNumber: 0,
              pageSize: 1000,
              sort: { empty: true, unsorted: true, sorted: false },
              offset: 0,
              paged: true,
              unpaged: false,
            },
            totalPages: 1,
            totalElements: 5,
            last: true,
            size: 1000,
            number: 0,
            sort: { empty: true, unsorted: true, sorted: false },
            first: true,
            numberOfElements: 5,
            empty: false,
          },
          offences: [
            { id: '1', code: '51:1', description: 'Commits any assault' },
            { id: '48', code: '51:22', description: 'Disobeys any lawful order' },
            {
              id: '6',
              code: '51:5',
              description:
                'Intentionally endangers the health or personal safety of others or, by his conduct, is reckless whether such health or personal safety is endangered',
            },
          ],
          agencies: [{ agencyId: 'HVI', description: 'Haverigg (HMP)', active: true }],
        },
      },
    })
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

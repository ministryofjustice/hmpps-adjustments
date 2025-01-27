import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetAdjustmentThingsToDo: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/court-cases-release-dates-api/service-definitions/prisoner/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          services: {
            overview: {
              href: 'http://localhost:8000/prisoner/AB1234AB/overview',
              text: 'Overview',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
            adjustments: {
              href: 'http://localhost:3007/A1234AB',
              text: 'Adjustments',
              thingsToDo: {
                count: 1,
                things: [
                  {
                    title: 'Review ADA updates',
                    message: 'message',
                    buttonText: 'Review ADA',
                    buttonHref: 'http://localhost:3007/A1234AB/additional-days/review-prospective',
                    type: 'ADA_INTERCEPT',
                  },
                ],
              },
            },
            releaseDates: {
              href: 'http://localhost:8004?prisonId=AB1234AB',
              text: 'Release dates and calculations',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
          },
        },
      },
    })
  },
  stubGetThingsToDo: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/court-cases-release-dates-api/service-definitions/prisoner/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          services: {
            overview: {
              href: 'http://localhost:8000/prisoner/AB1234AB/overview',
              text: 'Overview',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
            adjustments: {
              href: 'http://localhost:8002/AB1234AB',
              text: 'Adjustments',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
            releaseDates: {
              href: 'http://localhost:8004?prisonId=AB1234AB',
              text: 'Release dates and calculations',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
          },
        },
      },
    })
  },
}

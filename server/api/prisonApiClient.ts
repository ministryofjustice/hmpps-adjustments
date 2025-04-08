import { Readable } from 'stream'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import type {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiCourtDateResult,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import { SentenceCalcDates } from '../@types/prisonApi/prisonClientTypes'

export default class PrisonApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Prison API', config.apis.prisonApi as ApiConfig, token)
  }

  async getUsersCaseloads(): Promise<PrisonApiUserCaseloads[]> {
    return this.restClient.get({ path: `/api/users/me/caseLoads` }) as Promise<PrisonApiUserCaseloads[]>
  }

  async getCourtDateResults(nomsId: string): Promise<PrisonApiCourtDateResult[]> {
    return this.restClient.get({
      path: `/api/digital-warrant/court-date-results/${nomsId}`,
    }) as Promise<PrisonApiCourtDateResult[]>
  }

  async getBookingAndSentenceAdjustments(bookingId: number): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return this.restClient.get({
      path: `/api/adjustments/${bookingId}/sentence-and-booking`,
    }) as Promise<PrisonApiBookingAndSentenceAdjustments>
  }

  async getSentencesAndOffences(bookingId: string): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return (await this.restClient.get({
      path: `/api/offender-sentences/booking/${bookingId}/sentences-and-offences`,
    })) as Promise<unknown> as Promise<PrisonApiOffenderSentenceAndOffences[]>
  }

  async getPrisonerImage(prisonerNumber: string): Promise<Readable> {
    return this.restClient.stream({
      path: `/api/bookings/offenderNo/${prisonerNumber}/image/data`,
    })
  }

  async getOffenderDates(bookingId: string): Promise<SentenceCalcDates> {
    return this.restClient.get({
      path: `/api/offender-dates/${bookingId}`,
    }) as Promise<SentenceCalcDates>
  }
}

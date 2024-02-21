import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import type {
  PrisonApiAdjudicationSearchResponse,
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiCourtDateResult,
  PrisonApiIndividualAdjudication,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'

export default class PrisonApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Prison API', config.apis.prisonApi as ApiConfig, token)
  }

  async getPrisonerDetail(nomsId: string): Promise<PrisonApiPrisoner> {
    return this.restClient.get({ path: `/api/offenders/${nomsId}` }) as Promise<PrisonApiPrisoner>
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

  async getAdjudications(nomsId: string): Promise<PrisonApiAdjudicationSearchResponse> {
    return this.restClient.get({
      headers: { 'Page-Limit': '1000' },
      path: `/api/offenders/${nomsId}/adjudications`,
    }) as Promise<PrisonApiAdjudicationSearchResponse>
  }

  async getAdjudication(nomsId: string, adjudationNumber: number): Promise<PrisonApiIndividualAdjudication> {
    return this.restClient.get({
      path: `/api/offenders/${nomsId}/adjudications/${adjudationNumber}`,
    }) as Promise<PrisonApiIndividualAdjudication>
  }
}

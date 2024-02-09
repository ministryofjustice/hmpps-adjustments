import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import type {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiCourtDateResult,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import { AdjudicationSearchResponse, IndividualAdjudication } from '../@types/adjudications/adjudicationTypes'

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

  async getSentencesAndOffences(bookingId: number): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return (await this.restClient.get({
      path: `/api/offender-sentences/booking/${bookingId}/sentences-and-offences`,
    })) as Promise<unknown> as Promise<PrisonApiOffenderSentenceAndOffences[]>
  }

  async getAdjudications(nomsId: string): Promise<AdjudicationSearchResponse> {
    return this.restClient.get({
      path: `/api/offenders/${nomsId}/adjudications?size=1000`,
    }) as Promise<AdjudicationSearchResponse>
  }

  async getAdjudication(nomsId: string, adjudationNumber: number): Promise<IndividualAdjudication> {
    return this.restClient.get({
      path: `/api/offenders/${nomsId}/adjudications/${adjudationNumber}`,
    }) as Promise<IndividualAdjudication>
  }
}

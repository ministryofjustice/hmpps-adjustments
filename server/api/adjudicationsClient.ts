import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import { AdjudicationSearchResponse, IndividualAdjudication } from '../@types/adjudications/adjudicationTypes'

export default class AdjudicationClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Adjudication API', config.apis.adjudications as ApiConfig, token)
  }

  // async getAdjudications(nomsId: string): Promise<AdjudicationSearchResponse> {
  //   return (await this.restClient.get({
  //     path: `/adjudications/${nomsId}/adjudications?size=1000`,
  //   })) as Promise<unknown> as Promise<AdjudicationSearchResponse>
  // }

  // async getAdjudication(nomsId: string, chargeId: number): Promise<IndividualAdjudication> {
  //   return (await this.restClient.get({
  //     path: `/adjudications/${nomsId}/charge/${chargeId}`,
  //   })) as Promise<unknown> as Promise<IndividualAdjudication>
  // }
}

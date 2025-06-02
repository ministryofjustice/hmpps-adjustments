import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import { LegacySentenceTypeGroupingSummary } from '../@types/remandAndSentencingApi/types'

export default class RemandAndSentencingApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Remand And Sentencing API',
      config.apis.remandAndSentencingApi as ApiConfig,
      token,
    )
  }

  async getNomisSentenceTypeDetails(nomisSentenceTypeReference: string): Promise<LegacySentenceTypeGroupingSummary> {
    return this.restClient.get({
      path: '/legacy/sentence-type/summary',
      query: { nomisSentenceTypeReference },
    })
  }
}

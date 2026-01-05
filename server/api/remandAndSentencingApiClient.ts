import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import { SentenceTypesAndItsDetails } from '../@types/remandAndSentencingApi/remandAndSentencingApiTypes'

export default class RemandAndSentencingApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Remand and Sentencing API',
      config.apis.remandAndSentencingApi as ApiConfig,
      token,
    )
  }

  async getSentenceTypesAndItsDetails(): Promise<SentenceTypesAndItsDetails> {
    return this.restClient.get<SentenceTypesAndItsDetails>({
      path: '/legacy/sentence-type/all/summary',
    }) as Promise<SentenceTypesAndItsDetails>
  }
}

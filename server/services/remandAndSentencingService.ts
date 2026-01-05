import { SentenceTypesAndItsDetails } from '../@types/remandAndSentencingApi/remandAndSentencingApiTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { HmppsAuthClient } from '../data'

export default class RemandAndSentencingService {
  public cache: { data: SentenceTypesAndItsDetails | null; expiry: number } = { data: null, expiry: 0 }

  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public isSentenceRecalled(sentenceCalculationType: string): boolean {
    if (!this.cache.data) {
      throw new Error('Sentence types data is not loaded. Ensure it is preloaded before calling this function.')
    }

    const sentence = this.cache.data.find(type => type.nomisSentenceTypeReference === sentenceCalculationType)
    return sentence ? sentence.recall.type !== 'NONE' && !!sentence.recall.type : false
  }

  public async getSentenceTypeAndItsDetails(username: string): Promise<SentenceTypesAndItsDetails> {
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0) // Set to midnight of the next day

    if (this.cache.data && this.cache.expiry > now.getTime()) {
      return this.cache.data
    }

    const token = await this.getSystemClientToken(username)
    const data = await new RemandAndSentencingApiClient(token).getSentenceTypesAndItsDetails()

    this.cache = { data, expiry: midnight.getTime() } // Cache data until midnight
    return data
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}

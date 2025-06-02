import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { HmppsAuthClient } from '../data'

export default class RemandAndSentencingService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  public async isSentenceTypeRecall(username: string, nomisSentenceType: string): Promise<boolean> {
    const nomisSentenceTypeDetails = await new RemandAndSentencingApiClient(
      await this.getSystemClientToken(username),
    ).getNomisSentenceTypeDetails(nomisSentenceType)
    return nomisSentenceTypeDetails?.recall?.type !== 'NONE' && !!nomisSentenceTypeDetails?.recall?.type
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}

import { IdentifyRemandDecision, RemandResult } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import IdentifyRemandPeriodsClient from '../api/identifyRemandPeriodsClient'

export default class IdentifyRemandPeriodsService {
  public async calculateRelevantRemand(nomsId: string, token: string): Promise<RemandResult> {
    return new IdentifyRemandPeriodsClient(token).calculateRelevantRemand(nomsId)
  }

  public async getRemandDecision(nomsId: string, token: string): Promise<IdentifyRemandDecision> {
    const result = await new IdentifyRemandPeriodsClient(token).getRemandDecision(nomsId)
    return Object.keys(result).length ? result : null
  }
}

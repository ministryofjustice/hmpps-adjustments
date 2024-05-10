import { AdaAdjudicationDetails } from '../@types/adjustments/adjustmentsTypes'

export default class AdaComparisonModel {
  constructor(
    public prisonApiDetails: AdaAdjudicationDetails,
    public adjudicationApiDetails: AdaAdjudicationDetails,
    public currentApi: string,
  ) {}

  public prisonApiJSON() {
    return JSON.stringify(this.prisonApiDetails, null, 2)
  }

  public adjudicationJSON() {
    return JSON.stringify(this.adjudicationApiDetails, null, 2)
  }

  public otherApi() {
    return this.currentApi === 'PRISON-API' ? 'ADJUDICATIONS-API' : 'PRISON-API'
  }
}

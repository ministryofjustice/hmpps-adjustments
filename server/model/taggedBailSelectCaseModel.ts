import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class TaggedBailSelectCaseModel {
  constructor(public prisonerDetail: PrisonApiPrisoner) {}

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}`
  }
}

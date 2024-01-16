import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class TaggedBailDaysModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    private addOrEdit: string,
    private id: string,
  ) {}

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}/tagged-bail/select-case/${this.addOrEdit}/${this.id}`
  }
}

import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import TaggedBailDaysForm from './taggedBailDaysForm'

export default class TaggedBailDaysModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    private addOrEdit: string,
    private id: string,
    public form: TaggedBailDaysForm,
  ) {}

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}/tagged-bail/select-case/${this.addOrEdit}/${this.id}`
  }
}

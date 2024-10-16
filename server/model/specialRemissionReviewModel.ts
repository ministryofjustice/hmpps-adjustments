import SessionAdjustment from '../@types/AdjustmentTypes'
import specialRemissionType from './specialRemissionType'

export default class SpecialRemissionReviewModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/special-remission/type/${this.addOrEdit}/${this.id}`
  }

  public specialRemissionType(): string {
    return specialRemissionType.find(it => it.value === this.adjustment.specialRemission?.type).text
  }

  public cancelLink(): string {
    return `/${this.nomsId}/`
  }
}

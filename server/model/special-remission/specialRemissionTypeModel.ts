import SessionAdjustment from '../../@types/AdjustmentTypes'
import specialRemissionType from './specialRemissionType'

export default class SpecialRemissionTypeModel {
  specialRemissionType: 'MERITORIOUS_CONDUCT' | 'RELEASE_DATE_CALCULATED_TOO_EARLY' | 'RELEASE_IN_ERROR'

  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
    public notSelected?: boolean,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/special-remission/days/${this.addOrEdit}/${this.id}`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/special-remission/view`
  }

  public errorMessage(): { text: string; href: string } {
    return this.notSelected
      ? { text: 'You must select the type of special remission', href: '#specialRemissionType' }
      : null
  }

  specialRemissionTypes() {
    return specialRemissionType.map(it => {
      return { ...it, checked: this.adjustment.specialRemission?.type === it.value }
    })
  }
}

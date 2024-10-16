export default class SpecialRemissionCheckModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public notSelected?: boolean,
  ) {}

  public backlink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/special-remission/view`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}` : `/${this.nomsId}/special-remission/view`
  }

  public errorMessage(): { text: string; href: string } {
    return this.notSelected
      ? { text: 'You must select if PPCS have provided the number of special remission days', href: '#ppcsDays' }
      : null
  }
}

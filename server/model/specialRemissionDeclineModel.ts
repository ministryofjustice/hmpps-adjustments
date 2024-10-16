export default class SpecialRemissionDeclineModel {
  constructor(
    public nomsId: string,
    public addOrEdit: string,
    public id: string,
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/special-remission/check/${this.addOrEdit}/${this.id}`
  }
}

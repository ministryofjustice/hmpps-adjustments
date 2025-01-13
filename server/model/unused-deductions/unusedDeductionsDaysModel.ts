import UnusedDeductionsDaysForm from './unusedDeductionsDaysForm'

export default class UnusedDeductionsDaysModel {
  constructor(
    public prisonerNumber: string,
    public addOrEdit: string,
    public form: UnusedDeductionsDaysForm,
  ) {}
}

import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class EditManualUnusedDeductionsPage extends AdjustmentsPage {
  constructor() {
    super('Edit the number of unused deductions')
  }

  public delete = (): PageElement => cy.get('[data-qa=remove-button]')

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class AddManualUnusedDeductionsPage extends AdjustmentsPage {
  constructor() {
    super('Enter the number of unused deductions')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

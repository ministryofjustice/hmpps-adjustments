import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class AdaSubmitPage extends AdjustmentsPage {
  constructor() {
    super('Confirm and save')
  }

  public submitButton = (): PageElement => cy.get('[data-qa=submit-button]')
}

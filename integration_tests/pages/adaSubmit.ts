import AdjustmentsPage from './adjustmentsPage'
import Page, { PageElement } from './page'

export default class AdaSubmitPage extends AdjustmentsPage {
  constructor() {
    super('Review and submit ADAs')
  }

  public submitButton = (): PageElement => cy.get('[data-qa=submit-button]')
}

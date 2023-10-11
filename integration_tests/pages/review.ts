import AdjustmentsPage from './adjustmentsPage'
import Page, { PageElement } from './page'

export default class ReviewPage extends AdjustmentsPage {
  constructor() {
    super('Check your answers')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

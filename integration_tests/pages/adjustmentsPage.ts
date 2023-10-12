import Page from './page'

export type PageElement = Cypress.Chainable<JQuery>

export default abstract class AdjustmentsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  public skipAxe() {
    return false
  }
}

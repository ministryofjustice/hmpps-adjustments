import Page, { PageElement } from './page'

export default class ReviewPage extends Page {
  constructor() {
    super('Check adjustment information')
  }

  public skipAxe() {
    return false
  }

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

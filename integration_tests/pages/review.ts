import Page, { PageElement } from './page'

export default class ReviewPage extends Page {
  constructor() {
    super('Check your answers')
  }

  public skipAxe() {
    return false
  }

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

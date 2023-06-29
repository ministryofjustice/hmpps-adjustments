export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  constructor(private readonly title: string) {
    this.checkOnPage()
  }

  static verifyOnPage<T>(constructor: new (...args: unknown[]) => T, ...args: unknown[]): T {
    return new constructor(args)
  }

  abstract skipAxe(): boolean

  checkOnPage(): void {
    cy.get('h1').should('contain.text', this.title)
    if (!this.skipAxe()) {
      cy.injectAxe()
      cy.checkA11y()
    }
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')
}

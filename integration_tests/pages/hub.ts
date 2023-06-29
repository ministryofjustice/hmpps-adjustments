import Page, { PageElement } from './page'

export default class HubPage extends Page {
  constructor() {
    super('Review and apply adjustments')
  }

  skipAxe = (): boolean => false

  public static goTo(prisonerId: string): HubPage {
    cy.visit(`/${prisonerId}`)
    return new HubPage()
  }

  public radaLink = (): PageElement => cy.get('[data-qa=restored-additional-days]')

  public relevantRemandLink = (): PageElement => cy.get('[data-qa=relevant-remand]')

  public relevantRemandMessage = (): PageElement => cy.get('[data-qa=relevant-remand-message]')

  public successMessage = (): PageElement => cy.get('[data-qa=success-message]')
}

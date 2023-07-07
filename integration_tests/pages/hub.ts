import Page, { PageElement } from './page'

export default class HubPage extends Page {
  constructor() {
    super('Review and apply adjustments')
  }

  public skipAxe() {
    return false
  }

  public static goTo(prisonerId: string): HubPage {
    cy.visit(`/${prisonerId}`)
    return new HubPage()
  }

  public addRadaLink = (): PageElement => cy.get('[data-qa=add-restored-additional-days]')

  public viewRadaLink = (): PageElement => cy.get('[data-qa=view-restored-additional-days]')

  public relevantRemandLink = (): PageElement => cy.get('[data-qa=relevant-remand]')

  public relevantRemandMessage = (): PageElement => cy.get('[data-qa=relevant-remand-message]')

  public successMessage = (): PageElement => cy.get('[data-qa=success-message]')
}

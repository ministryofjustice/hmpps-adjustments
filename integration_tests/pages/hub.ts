import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class HubPage extends AdjustmentsPage {
  constructor() {
    super('Review and apply adjustments')
  }

  public static goTo(prisonerId: string): HubPage {
    cy.visit(`/${prisonerId}`)
    return new HubPage()
  }

  public addRadaLink = (): PageElement => cy.get('[data-qa=add-restored-additional-days]')

  public viewRadaLink = (): PageElement => cy.get('[data-qa=view-restored-additional-days]')

  public addRemandLink = (): PageElement => cy.get('[data-qa=add-remand]')

  public viewRemandLink = (): PageElement => cy.get('[data-qa=view-remand]')

  public relevantRemandMessage = (): PageElement => cy.get('[data-qa=relevant-remand-message]')

  public successMessage = (): PageElement => cy.get('[data-qa=success-message]')

  public errorMessage = (): PageElement => cy.get('[data-qa=error-message]')
}

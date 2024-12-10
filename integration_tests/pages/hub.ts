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

  public manualUnusedDeductionsLink = (): PageElement => cy.get('[data-qa=manual-unused-deductions]')

  public reviewUnusedDeductionsLink = (): PageElement => cy.get('[data-qa=review-unused-deductions]')

  public addRemandLink = (): PageElement => cy.get('[data-qa=add-remand]')

  public viewRemandLink = (): PageElement => cy.get('[data-qa=view-remand]')

  public addTaggedBailLink = (): PageElement => cy.get('[data-qa=add-tagged-bail]')

  public viewTaggedBailLink = (): PageElement => cy.get('[data-qa=view-tagged-bail]')

  public addLawfullyAtLargeLink = (): PageElement => cy.get('[data-qa=add-lawfully-at-large]')

  public viewLawfullyAtLargeLink = (): PageElement => cy.get('[data-qa=view-lawfully-at-large]')

  public addSpecialRemissionLink = (): PageElement => cy.get('[data-qa=add-special-remission]')

  public viewSpecialRemissionLink = (): PageElement => cy.get('[data-qa=view-special-remission]')

  public relevantRemandMessage = (): PageElement => cy.get('[data-qa=relevant-remand-message]')

  public successMessage = (): PageElement => cy.get('[data-qa=success-message]')

  public errorMessage = (): PageElement => cy.get('[data-qa=error-message]')
}

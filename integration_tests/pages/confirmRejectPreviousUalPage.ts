import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class ConfirmRejectPreviousUalPage extends AdjustmentsPage {
  constructor() {
    super('Are you sure you do not want to apply any previous periods of UAL?')
  }

  selectYes(): ConfirmRejectPreviousUalPage {
    this.yesRadio().click()
    return this
  }

  selectNo(): ConfirmRejectPreviousUalPage {
    this.noRadio().click()
    return this
  }

  clickContinue() {
    this.continueButton().click()
  }

  clickBack() {
    this.backLink().click()
  }

  clickCancel() {
    this.cancelButton().click()
  }

  private yesRadio = (): PageElement => cy.get('#yes-radio')

  private noRadio = (): PageElement => cy.get('#no-radio')

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private backLink = (): PageElement => cy.get('.govuk-back-link')

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}

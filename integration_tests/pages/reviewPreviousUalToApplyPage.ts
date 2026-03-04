import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class ReviewPreviousUalToApplyPage extends AdjustmentsPage {
  constructor() {
    super('Review UAL to be applied')
  }

  hasPeriod(id: string): ReviewPreviousUalToApplyPage {
    this.periodFirstCell(id).should('be.visible')
    return this
  }

  doesNotHavePeriod(id: string): ReviewPreviousUalToApplyPage {
    this.periodFirstCell(id).should('not.exist')
    return this
  }

  hasTotal(total: number): ReviewPreviousUalToApplyPage {
    this.totalCell().should('have.text', total)
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

  private backLink = (): PageElement => cy.get('.govuk-back-link')

  private periodFirstCell = (id: string): PageElement => cy.get(`[data-qa=period-to-apply-${id}]`)

  private totalCell = (): PageElement => cy.get(`[data-qa=total-days-to-apply]`)

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}

import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class ReviewPreviousUalPage extends AdjustmentsPage {
  constructor() {
    super('Review previous periods of UAL')
  }

  public static goTo(prisonerId: string): ReviewPreviousUalPage {
    cy.visit(`/${prisonerId}/review-unlawfully-at-large-to-apply`)
    return new ReviewPreviousUalPage()
  }

  hasPeriod(id: string): ReviewPreviousUalPage {
    this.periodCheckbox(id).should('exist')
    return this
  }

  selectPeriod(id: string): ReviewPreviousUalPage {
    this.periodCheckbox(id).check()
    return this
  }

  selectNoneApply(): ReviewPreviousUalPage {
    this.noneApplyCheckbox().check()
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

  private periodCheckbox = (id: string): PageElement => cy.get(`#previous-ual-periods-${id}`)

  private noneApplyCheckbox = (): PageElement => cy.get(`#none-apply-checkbox`)

  private continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  private backLink = (): PageElement => cy.get('.govuk-back-link')

  private cancelButton = (): PageElement => cy.get('[data-qa=cancel-button]')
}

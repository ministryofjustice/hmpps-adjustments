import AdaAprovePage from '../pages/adaApprove'
import AdaInterceptPage from '../pages/adaIntercept'
import AdaSubmitPage from '../pages/adaSubmit'
import HubPage from '../pages/hub'
import PadaPage from '../pages/pada'

context('Enter an ADA', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('stubGetRelevantRemand')
    cy.task('stubGetRemandDecision')
    cy.task('stubSearchAdjudications')
    cy.task('stubIndividualAdjudications')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubDeleteAda')
    cy.task('stubCreateAdjustment')
    cy.task('stubComponents')
  })

  it('Enter an AADA', () => {
    cy.signIn()
    const intercept = AdaInterceptPage.goTo('A1234AB')
    intercept.reviewLink().click()
    const pada = PadaPage.verifyOnPage(PadaPage)

    // Test frontend script for unselecting
    pada.checkboxByIndex(0).click({ force: true })
    pada.checkboxByIndex(0).should('be.checked')
    pada.noneSelectedCheckbox().should('not.be.checked')
    pada.noneSelectedCheckbox().click({ force: true })
    pada.noneSelectedCheckbox().should('be.checked')
    pada.checkboxByIndex(0).should('not.be.checked')
    pada.checkboxByIndex(1).click({ force: true })
    pada.noneSelectedCheckbox().should('not.be.checked')

    pada.continueButton().click()

    const approve = AdaAprovePage.verifyOnPage(AdaAprovePage)

    approve.approveButton().click()

    const submit = AdaSubmitPage.verifyOnPage(AdaSubmitPage)

    submit.submitButton().click()

    const hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('ADA details have been updated')
  })
})

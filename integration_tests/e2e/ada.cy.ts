import AdaAprovePage from '../pages/adaApprove'
import AdaInterceptPage from '../pages/adaIntercept'
import AdaSubmitPage from '../pages/adaSubmit'
import HubPage from '../pages/hub'
import PadaPage from '../pages/pada'

context('Enter a RADA', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
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
  })

  it('Enter a RADA', () => {
    cy.signIn()
    const intercept = AdaInterceptPage.goTo('A1234AB')
    intercept.reviewLink().click()
    const pada = PadaPage.verifyOnPage(PadaPage)

    // Test frontend script for unselecting
    pada.checkboxByIndex(0).click()
    pada.checkboxByIndex(0).should('be.checked')
    pada.noneSelectedCheckbox().should('not.be.checked')
    pada.noneSelectedCheckbox().click()
    pada.noneSelectedCheckbox().should('be.checked')
    pada.checkboxByIndex(0).should('not.be.checked')
    pada.checkboxByIndex(1).click()
    pada.noneSelectedCheckbox().should('not.be.checked')

    pada.continueButton().click()

    const approve = AdaAprovePage.verifyOnPage(AdaAprovePage)

    approve.approveButton().click()

    const submit = AdaSubmitPage.verifyOnPage(AdaSubmitPage)

    submit.submitButton().click()

    const hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('ADA updates have been saved')
  })
})

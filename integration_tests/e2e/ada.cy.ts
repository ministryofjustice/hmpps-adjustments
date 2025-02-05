import AdaAprovePage from '../pages/adaApprove'
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
    cy.task('subAdaDetailsForIntercept')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubDeleteAda')
    cy.task('stubCreateAdjustment')
    cy.task('stubComponents')
    cy.task('stubRejectProspectiveAda')
    cy.task('stubGetUnusedDeductionsCalculationResult')
    cy.task('stubGetAdjustmentThingsToDo')
    cy.task('stubEvictCache')
  })

  it('Enter an AADA', () => {
    cy.signIn()
    const hubPage = HubPage.goTo('A1234AB')
    hubPage.reviewLink().click()
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

import HubPage from '../pages/hub'
import FormPage from '../pages/form'
import RemandSelectOffencesPage from '../pages/remandSelectOffences'
import ReviewRemandPage from '../pages/reviewRemand'
import SaveRemandPage from '../pages/saveRemand'
import ViewRemandPage from '../pages/viewRemand'

context('Enter Remand', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('stubGetRelevantRemand')
    cy.task('stubGetRemandDecision')
    cy.task('stubSearchAdjudicationsNoReview')
    cy.task('stubIndividualAdjudicationsNoReview')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubCreateAdjustment')
    cy.task('stubComponents')
  })

  it('Add Remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.addRemandLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter remand dates')
    form.enterFromDate('2023-04-05')
    form.enterToDate('2023-04-17')
    form.submitButton().click()
    const selectOffencesPage = RemandSelectOffencesPage.verifyOnPage(RemandSelectOffencesPage)
    selectOffencesPage.offenceRadio().first().click({ force: true })
    selectOffencesPage.submit().click()
    const reviewRemand = ReviewRemandPage.verifyOnPage(ReviewRemandPage)
    reviewRemand.noMoreRemandRadio().click({ force: true })
    reviewRemand.submit().click()

    const saveRemand = SaveRemandPage.verifyOnPage(SaveRemandPage)
    saveRemand.submit().click()
    hub.successMessage().contains('13 days of remand have been saved')
  })

  it('View Remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewRemandLink().click()
    ViewRemandPage.verifyOnPage(ViewRemandPage)
    // TODO enhance this view test + edit/delete (awaiting redesign tickets)
  })
})

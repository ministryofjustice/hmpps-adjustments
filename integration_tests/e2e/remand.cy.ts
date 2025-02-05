import HubPage from '../pages/hub'
import FormPage from '../pages/form'
import RemandSelectOffencesPage from '../pages/remand/remandSelectOffences'
import ReviewRemandPage from '../pages/remand/reviewRemand'
import SaveRemandPage from '../pages/remand/saveRemand'
import ViewRemandPage from '../pages/remand/viewRemand'
import EditRemandPage from '../pages/remand/editRemand'
import RemoveRemandPage from '../pages/remand/removeRemand'
import ConfirmEditRemandPage from '../pages/remand/confirmEditRemand'

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
    cy.task('stubGetRemandAdjustment')
    cy.task('subAdaDetailsNoIntercept')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubCreateAdjustment')
    cy.task('stubUpdateRemandAdjustment')
    cy.task('stubDeleteRemandAdjustment')
    cy.task('stubComponents')
    cy.task('stubGetUnusedDeductionsCalculationResult')
    cy.task('stubGetThingsToDo')
    cy.task('stubEvictCache')
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
  })

  it('Edit Remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewRemandLink().click()
    const viewRemandPage = ViewRemandPage.verifyOnPage(ViewRemandPage)
    viewRemandPage.editLink().click()
    const editRemandPage = EditRemandPage.verifyOnPage(EditRemandPage)
    editRemandPage.editLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit remand dates')
    form.clearToAndFromDateFields()
    form.enterFromDate('2023-04-05')
    form.enterToDate('2023-09-05')
    form.submitButton().click()
    const confirmEditRemandPage = ConfirmEditRemandPage.verifyOnPage(ConfirmEditRemandPage)
    confirmEditRemandPage.submit().click()
    hub.successMessage().contains('Remand details have been updated')
  })

  it('Delete Remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewRemandLink().click()
    const viewRemandPage = ViewRemandPage.verifyOnPage(ViewRemandPage)
    viewRemandPage.deleteLink().click()
    const removeRemandPage = RemoveRemandPage.verifyOnPage(RemoveRemandPage)
    removeRemandPage.submit().click()
    hub.successMessage().contains('11 days of remand have been deleted')
  })
})

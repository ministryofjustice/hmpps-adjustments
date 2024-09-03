import HubPage from '../pages/hub'
import FormPage from '../pages/form'
import AddManualUnusedDeductionsPage from '../pages/unused-deductions/addManualUnusedDeduction'
import ReviewManualUnusedDeductionsPage from '../pages/unused-deductions/reviewManualUnusedDeduction'
import EditManualUnusedDeductionsPage from '../pages/unused-deductions/editManualUnusedDeduction'

context('Add/edit/delete Unused Deductions', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('subAdaDetailsNoIntercept')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetUnusedDeductionsCalculationResultUnsupportedEdit')
    cy.task('stubSetUnusedDaysManually')
  })

  it('Add Manual Unused Deduction', () => {
    cy.task('stubGetAdjustments')
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.manualUnusedDeductionsLink().click()
    AddManualUnusedDeductionsPage.verifyOnPage(AddManualUnusedDeductionsPage)
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter the number of unused deductions')
    form.enterDays('10')
    form.submitButton().click()
    const reviewManualUnusedDeductionsPage = ReviewManualUnusedDeductionsPage.verifyOnPage(
      ReviewManualUnusedDeductionsPage,
    )
    reviewManualUnusedDeductionsPage.submit().click()
    hub.successMessage().contains('10 days of unused deductions have been saved')
  })

  it('Edit Manual Unused Deduction', () => {
    cy.task('stubGetAdjustmentsWithUnused')
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.manualUnusedDeductionsLink().click()
    EditManualUnusedDeductionsPage.verifyOnPage(EditManualUnusedDeductionsPage)
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit the number of unused deductions')
    form.enterDays('20')
    form.submitButton().click()
    const reviewManualUnusedDeductionsPage = ReviewManualUnusedDeductionsPage.verifyOnPage(
      ReviewManualUnusedDeductionsPage,
    )
    reviewManualUnusedDeductionsPage.submit().click()
    hub.successMessage().contains('Unused deductions details have been updated')
  })

  it('Delete Manual Unused Deduction', () => {
    cy.task('stubGetAdjustmentsWithUnused')
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.manualUnusedDeductionsLink().click()
    const editManualUnusedDeductionsPage = EditManualUnusedDeductionsPage.verifyOnPage(EditManualUnusedDeductionsPage)
    editManualUnusedDeductionsPage.delete().click()
    const reviewManualUnusedDeductionsPage = ReviewManualUnusedDeductionsPage.verifyOnPage(
      ReviewManualUnusedDeductionsPage,
    )
    reviewManualUnusedDeductionsPage.submit().click()
    hub.successMessage().contains('11 days of unused deductions have been deleted')
  })
})

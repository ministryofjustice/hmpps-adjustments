import HubPage from '../pages/hub'
import UnlawfullyAtLargeFormPage from '../pages/unlawfullyAtLarge/unlawfullyAtLargeFormPage'
import ReviewUnlawfullyAtLargePage from '../pages/unlawfullyAtLarge/reviewUnlawfullyAtLarge'
import ViewUnlawfullyAtLargePage from '../pages/unlawfullyAtLarge/viewUnlawfullyAtLarge'
import RemoveUnlawfullyAtLargePage from '../pages/unlawfullyAtLarge/removeUnlawfullyAtLarge'

context('Enter Unlawfully at Large', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('subAdaDetailsNoIntercept')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubCreateAdjustment')
    cy.task('stubGetUalAdjustment')
    cy.task('stubUpdateUalAdjustment')
    cy.task('stubDeleteUalAdjustment')
    cy.task('stubValidateAdjustment')
    cy.task('stubComponents')
    cy.task('stubGetUnusedDeductionsCalculationResult')
  })

  it('Add Unlawfully At Large', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.addUnlawfullyAtLargeLink().click()
    const form = UnlawfullyAtLargeFormPage.verifyOnPage<UnlawfullyAtLargeFormPage>(
      UnlawfullyAtLargeFormPage,
      'Enter UAL details',
    )
    form.enterFromDate('2024-04-20')
    form.enterToDate('2024-05-22')
    form.selectUALType().click()
    form.submitButton().click()
    const reviewUnlawfullyAtLargePage = ReviewUnlawfullyAtLargePage.verifyOnPage(ReviewUnlawfullyAtLargePage)
    reviewUnlawfullyAtLargePage.checkOnPage()
    reviewUnlawfullyAtLargePage.submit().click()
    hub.successMessage().contains('33 days of UAL have been saved')
  })
  it('View & Edit Unlawfully At Large', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewUnlawfullyAtLargeLink().click()
    const viewUnlawfullyAtLargePage = ViewUnlawfullyAtLargePage.verifyOnPage(ViewUnlawfullyAtLargePage)
    viewUnlawfullyAtLargePage.editLink().click()
    const form = UnlawfullyAtLargeFormPage.verifyOnPage<UnlawfullyAtLargeFormPage>(
      UnlawfullyAtLargeFormPage,
      'Edit UAL details',
    )
    form.clearToAndFromDateFields()
    form.enterFromDate('2023-04-01')
    form.enterToDate('2023-04-18')
    form.submitButton().click()
    const reviewUnlawfullyAtLargePage = ReviewUnlawfullyAtLargePage.verifyOnPage(ReviewUnlawfullyAtLargePage)
    reviewUnlawfullyAtLargePage.checkOnPage()
    reviewUnlawfullyAtLargePage.submit().click()
    hub.successMessage().contains('UAL details have been updated')
  })
  it('View & Delete Unlawfully At Large', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewUnlawfullyAtLargeLink().click()
    const viewUnlawfullyAtLargePage = ViewUnlawfullyAtLargePage.verifyOnPage(ViewUnlawfullyAtLargePage)
    viewUnlawfullyAtLargePage.deleteLink().click()
    const removeUnlawfullyAtLargePage = RemoveUnlawfullyAtLargePage.verifyOnPage(RemoveUnlawfullyAtLargePage)
    removeUnlawfullyAtLargePage.submit().click()
    hub.successMessage().contains('30 days of UAL have been deleted')
  })
})

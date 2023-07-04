import FormPage from '../pages/form'
import HubPage from '../pages/hub'
import ReviewPage from '../pages/review'
import WarningPage from '../pages/warning'

context('Enter a RADA', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('stubGetRelevantRemand')
    cy.task('stubValidateAdjustmentWithWarning')
    cy.task('stubCreateAdjustment')
    cy.task('stubGetAdjustment')
  })

  it('Enter a RADA', () => {
    cy.signIn()
    let hub = HubPage.goTo('A1234AB')
    hub.radaLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Adjust release dates')
    form.enterFromDate('2023-04-05')
    form.enterDays('25')
    form.submitButton().click()
    const warning = WarningPage.verifyOnPage(WarningPage)
    warning.yesRadio().click()
    warning.submit().click()
    const review = ReviewPage.verifyOnPage(ReviewPage)
    review.submit().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().should('contain.text', '25 days of RADA have been applied')
  })
})

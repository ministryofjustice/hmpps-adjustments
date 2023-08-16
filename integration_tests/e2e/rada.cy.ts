import FormPage from '../pages/form'
import HubPage from '../pages/hub'
import RemovePage from '../pages/remove'
import ReviewPage from '../pages/review'
import ViewPage from '../pages/view'
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
    cy.task('stubUpdateAdjustment')
    cy.task('stubRemoveAdjustment')
    cy.task('stubGetRemandDecision')
  })

  it('Add a RADA', () => {
    cy.signIn()
    let hub = HubPage.goTo('A1234AB')
    hub.addRadaLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter RADA details')
    form.enterFromDate('2023-04-05')
    form.enterDays('25')
    form.submitButton().click()
    const warning = WarningPage.verifyOnPage(WarningPage)
    warning.yesRadio().click()
    warning.submit().click()
    const review = ReviewPage.verifyOnPage(ReviewPage)
    review.submit().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('25 days of RADA have been added')
  })

  it('View and edit a RADA', () => {
    cy.signIn()
    let hub = HubPage.goTo('A1234AB')
    hub.viewRadaLink().click()
    const viewPage = ViewPage.verifyOnPage<ViewPage>(ViewPage, 'RADA details')
    const id = '4c3c057c-896d-4793-9022-f3001e209a36'
    viewPage.editLink(id).click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit RADA details')
    form.enterDays('26')
    form.submitButton().click()
    const warning = WarningPage.verifyOnPage(WarningPage)
    warning.yesRadio().click()
    warning.submit().click()
    const review = ReviewPage.verifyOnPage(ReviewPage)
    review.submit().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('25 days of RADA have been update')
  })

  it('View and remove a RADA', () => {
    cy.signIn()
    let hub = HubPage.goTo('A1234AB')
    hub.viewRadaLink().click()
    const viewPage = ViewPage.verifyOnPage<ViewPage>(ViewPage, 'RADA details')
    const id = '4c3c057c-896d-4793-9022-f3001e209a36'
    viewPage.removeLink(id).click()
    const removePage = RemovePage.verifyOnPage<RemovePage>(RemovePage, 'Are you sure you want to remove RADA')
    removePage.removeButton().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('25 days of RADA have been removed')
  })
})

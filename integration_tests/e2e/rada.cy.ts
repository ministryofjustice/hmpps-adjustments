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
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('stubGetRelevantRemand')
    cy.task('stubValidateAdjustmentWithWarning')
    cy.task('stubCreateAdjustment')
    cy.task('stubGetRadaAdjustment')
    cy.task('stubUpdateAdjustment')
    cy.task('stubDeleteRada')
    cy.task('stubGetRemandDecision')
    cy.task('subAdaDetailsNoIntercept')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubComponents')
    cy.task('stubGetUnusedDeductionsCalculationResult')
    cy.task('stubGetThingsToDo')
    cy.task('stubEvictCache')
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
    warning.yesRadio().click({ force: true })
    warning.submit().click()
    const review = ReviewPage.verifyOnPage(ReviewPage)
    review.submit().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('25 days of RADA have been saved')
  })

  it('Add a RADA when no ADAs exist produces error message', () => {
    cy.task('stubGetAdjustmentsNoAdas')
    cy.signIn()
    let hub = HubPage.goTo('A1234AB')
    hub.addRadaLink().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub
      .errorMessage()
      .contains(
        'There are currently no ADAs (Additional days awarded) recorded. You must record the ADAs before applying any RADAs',
      )
  })

  it('View and edit a RADA', () => {
    cy.signIn()
    let hub = HubPage.goTo('A1234AB')
    hub.viewRadaLink().click()
    const viewPage = ViewPage.verifyOnPage<ViewPage>(ViewPage, 'RADA overview')
    viewPage.table().contains('Leeds')
    const id = '4c3c057c-896d-4793-9022-f3001e209a36'
    viewPage.editLink(id).click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit RADA details')
    form.enterDays('26')
    form.submitButton().click()
    const warning = WarningPage.verifyOnPage(WarningPage)
    warning.yesRadio().click({ force: true })
    warning.submit().click()
    const review = ReviewPage.verifyOnPage(ReviewPage)
    review.submit().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('RADA details have been updated')
  })

  it('View and remove a RADA', () => {
    cy.signIn()
    let hub = HubPage.goTo('A1234AB')
    hub.viewRadaLink().click()
    const viewPage = ViewPage.verifyOnPage<ViewPage>(ViewPage, 'RADA overview')
    const id = '4c3c057c-896d-4793-9022-f3001e209a36'
    viewPage.removeLink(id).click()
    const removePage = RemovePage.verifyOnPage<RemovePage>(RemovePage, 'Delete RADA')
    removePage.removeButton().click()
    hub = HubPage.verifyOnPage(HubPage)
    hub.successMessage().contains('25 days of RADA have been deleted')
  })
})

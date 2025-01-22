import HubPage from '../pages/hub'
import AppealApplicantCountDaysFormPage from '../pages/appealApplicantNotToCount/appealApplicantCountDaysFormPage'
import AppealApplicantCountCourtRefNumFormPage from '../pages/appealApplicantNotToCount/appealApplicantCountCourtRefNumFormPage'
import SaveAppealApplicantCount from '../pages/appealApplicantNotToCount/saveAppealApplicantCount'
import ViewAppealApplicantCountPage from '../pages/appealApplicantNotToCount/viewAppealApplicantCount'
import RemoveAppealApplicantPage from '../pages/appealApplicantNotToCount/removeAppealApplicantPage'

context('Enter Appeal Applicant Not To Count', () => {
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
    cy.task('stubGetAppealApplicantAdjustment')
    cy.task('stubUpdateAppealApplicantAdjustment')
    cy.task('stubDeleteAppealApplicantAdjustment')
    cy.task('stubValidateAdjustment')
    cy.task('stubComponents')
    cy.task('stubGetUnusedDeductionsCalculationResult')
    cy.task('stubGetThingsToDo')
  })

  it('Add Appeal Applicant Not To Count', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.addAppealApplicantLink().click()
    const form = AppealApplicantCountDaysFormPage.verifyOnPage<AppealApplicantCountDaysFormPage>(
      AppealApplicantCountDaysFormPage,
      'Enter the number of days spent as an appeal applicant that will not count towards the sentence',
    )
    form.enterDaysSpentAppealApplicant('2')
    form.submitButton().click()

    const formCourtRefNumber =
      AppealApplicantCountCourtRefNumFormPage.verifyOnPage<AppealApplicantCountCourtRefNumFormPage>(
        AppealApplicantCountCourtRefNumFormPage,
        'Enter the the Court of appeal Reference number',
      )
    formCourtRefNumber.enterCourtRefNumber('12345678')
    formCourtRefNumber.submitButton().click()

    const confirm = SaveAppealApplicantCount.verifyOnPage<SaveAppealApplicantCount>(
      SaveAppealApplicantCount,
      'Confirm and save',
    )
    confirm.checkOnPage()
    confirm.submit().click()

    hub.successMessage().contains('2 days of Time spent as an appeal applicant not to count have been saved')
  })

  it('View & Edit Appeal Applicant', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewAppealApplicantLink().click()

    const viewAppealApplicantCountPage = ViewAppealApplicantCountPage.verifyOnPage(ViewAppealApplicantCountPage)
    viewAppealApplicantCountPage.editLink().click()

    const form = AppealApplicantCountDaysFormPage.verifyOnPage<AppealApplicantCountDaysFormPage>(
      AppealApplicantCountDaysFormPage,
      'Edit the number of days spent as an appeal applicant that will not count towards the sentence',
    )
    form.enterDaysSpentAppealApplicant('2')
    form.submitButton().click()

    const formCourtRefNumber =
      AppealApplicantCountCourtRefNumFormPage.verifyOnPage<AppealApplicantCountCourtRefNumFormPage>(
        AppealApplicantCountCourtRefNumFormPage,
        'Edit the Court of Appeal reference number',
      )
    formCourtRefNumber.enterCourtRefNumber('12345679')
    formCourtRefNumber.submitButton().click()

    const confirm = SaveAppealApplicantCount.verifyOnPage<SaveAppealApplicantCount>(
      SaveAppealApplicantCount,
      'Confirm and save',
    )
    confirm.checkOnPage()
    confirm.submit().click()

    hub.successMessage().contains('LAL (Lawfully at large) details have been updated')
  })

  it('View & Delete Appeal Applicant', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewAppealApplicantLink().click()

    const viewAppealApplicantPage = ViewAppealApplicantCountPage.verifyOnPage(ViewAppealApplicantCountPage)
    viewAppealApplicantPage.deleteLink().click()

    const removeAppealApplicantPage = RemoveAppealApplicantPage.verifyOnPage(RemoveAppealApplicantPage)
    removeAppealApplicantPage.submit().click()

    hub.successMessage().contains('1 day of Time spent as an appeal applicant not to count has been deleted')
  })
})

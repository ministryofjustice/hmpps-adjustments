import HubPage from '../pages/hub'
import CheckPccsSpecialRemissionDays from '../pages/specialRemission/checkPccsSpecialRemissionDays'
import FormPage from '../pages/form'
import EnterSpecialRemissionType from '../pages/specialRemission/enterSpecialRemissionType'
import SaveSpecialRemission from '../pages/specialRemission/saveSpecialRemission'
import NoContinueSpecialRemission from '../pages/specialRemission/noContinueSpecialRemission'
import ViewSpecialRemission from '../pages/specialRemission/viewSpecialRemission'
import DeleteSpecialRemission from '../pages/specialRemission/deleteSpecialRemission'

context('Enter Special Remission', () => {
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
    cy.task('stubGetSpecialRemissionAdjustment')
    cy.task('stubUpdateSpecialRemissionAdjustment')
    cy.task('stubDeleteSpecialRemissionAdjustment')
    cy.task('stubValidateAdjustment')
    cy.task('stubComponents')
    cy.task('stubGetUnusedDeductionsCalculationResult')
  })

  it('Add Special Remission Happy Path', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.addSpecialRemissionLink().click()
    const checkPccs = CheckPccsSpecialRemissionDays.verifyOnPage<CheckPccsSpecialRemissionDays>(
      CheckPccsSpecialRemissionDays,
      'Has PPCS provided the number of special remission days',
    )
    checkPccs.selectYes().click()
    checkPccs.submit().click()

    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter the number of special remission days')
    form.enterDays('45')
    form.submitButton().click()

    const type = EnterSpecialRemissionType.verifyOnPage<EnterSpecialRemissionType>(
      EnterSpecialRemissionType,
      'Select the type of special remission',
    )
    type.selectRemissionType('MERITORIOUS_CONDUCT').click()
    type.submit().click()

    const confirm = SaveSpecialRemission.verifyOnPage<SaveSpecialRemission>(SaveSpecialRemission, 'Confirm and save')
    confirm.checkOnPage()
    confirm.submit().click()

    hub.successMessage().contains('45 days of Special remission have been saved')
  })

  it('No days from PPCS returns to the hub', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.addSpecialRemissionLink().click()
    const checkPccs = CheckPccsSpecialRemissionDays.verifyOnPage<CheckPccsSpecialRemissionDays>(
      CheckPccsSpecialRemissionDays,
      'Has PPCS provided the number of special remission days',
    )
    checkPccs.selectNo().click()
    checkPccs.submit().click()

    const noContinue = NoContinueSpecialRemission.verifyOnPage<NoContinueSpecialRemission>(
      NoContinueSpecialRemission,
      'You cannot continue',
    )

    noContinue.returnToHomepage().click()
    hub.checkOnPage()
  })

  it('View and edit', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewSpecialRemissionLink().click()
    const viewSpecialRemission = ViewSpecialRemission.verifyOnPage<ViewSpecialRemission>(
      ViewSpecialRemission,
      'Special remission details',
    )
    viewSpecialRemission.editLink().click()
    const checkPccs = CheckPccsSpecialRemissionDays.verifyOnPage<CheckPccsSpecialRemissionDays>(
      CheckPccsSpecialRemissionDays,
      'Has PPCS provided the number of special remission days',
    )
    checkPccs.selectYes().click()
    checkPccs.submit().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit the number of special remission days')
    form.enterDays('45')
    form.submitButton().click()
    const type = EnterSpecialRemissionType.verifyOnPage<EnterSpecialRemissionType>(
      EnterSpecialRemissionType,
      'Select the type of special remission',
    )
    type.selectRemissionType('MERITORIOUS_CONDUCT').click()
    type.submit().click()
    const confirm = SaveSpecialRemission.verifyOnPage<SaveSpecialRemission>(SaveSpecialRemission)
    confirm.checkOnPage()
    confirm.submit().click()
    hub.successMessage().contains('Special remission details have been updated')
  })

  it('View and delete', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewSpecialRemissionLink().click()
    const viewSpecialRemission = ViewSpecialRemission.verifyOnPage<ViewSpecialRemission>(
      ViewSpecialRemission,
      'Special remission details',
    )

    viewSpecialRemission.deleteLink().click()
    const deleteSpecialRemission = DeleteSpecialRemission.verifyOnPage<DeleteSpecialRemission>(DeleteSpecialRemission)

    deleteSpecialRemission.checkOnPage()
    deleteSpecialRemission.deleteButton().click()
    cy.screenshot('deleteSpecialRemission')
    hub.successMessage().contains('42 days of Special remission have been deleted')
  })
})

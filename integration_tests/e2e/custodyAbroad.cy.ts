import HubPage from '../pages/hub'
import FormPage from '../pages/form'
import EnterCustodyAbroadDocumentationSource from '../pages/custody-abroad/enterCustodyAbroadDocumentationSource'
import SaveCustodyAbroad from '../pages/custody-abroad/saveCustodyAbroad'
import ViewCustodyAbroad from '../pages/custody-abroad/viewCustodyAbroad'
import DeleteCustodyAbroad from '../pages/custody-abroad/deleteCustodyAbroad'
import CustodyAbroadSelectOffences from '../pages/custody-abroad/custodyAbroadSelectOffences'
import CustodyAbroadEditOffences from '../pages/custody-abroad/custodyAbroadEditOffences'

context('Enter Time Spent in Custody Abroad', () => {
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
    cy.task('stubGetCustodyAbroadAdjustment')
    cy.task('stubUpdateCustodyAbroadAdjustment')
    cy.task('stubDeleteCustodyAbroadAdjustment')
    cy.task('stubValidateAdjustment')
    cy.task('stubComponents')
    cy.task('stubGetUnusedDeductionsCalculationResult')
    cy.task('stubGetThingsToDo')
    cy.task('stubEvictCache')
  })

  it('Add Time Spent in Custody Abroad Happy Path', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.addCustodyAbroadLink().click()

    const documenationSource =
      EnterCustodyAbroadDocumentationSource.verifyOnPage<EnterCustodyAbroadDocumentationSource>(
        EnterCustodyAbroadDocumentationSource,
        'Select the documentation that confirms time spent in custody abroad will count towards the sentence',
      )

    documenationSource.selectDocumenationSource('PPCS_LETTER').click()
    documenationSource.submit().click()

    const form = FormPage.verifyOnPage<FormPage>(
      FormPage,
      'Enter the number of days spent in custody abroad that will count towards the sentence',
    )
    form.enterDays('27')
    form.submitButton().click()

    const selectOffencesPage = CustodyAbroadSelectOffences.verifyOnPage(CustodyAbroadSelectOffences)
    selectOffencesPage.offenceRadio().first().click({ force: true })
    selectOffencesPage.submit().click()

    const confirm = SaveCustodyAbroad.verifyOnPage<SaveCustodyAbroad>(SaveCustodyAbroad, 'Confirm and save')
    confirm.checkOnPage()
    confirm.submit().click()

    hub.successMessage().contains('27 days of time spent in custody abroad have been saved')
  })

  it('View and edit', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewCustodyAbroadLink().click()
    const viewCustodyAbraod = ViewCustodyAbroad.verifyOnPage<ViewCustodyAbroad>(
      ViewCustodyAbroad,
      'Time spent in custody abroad details',
    )
    viewCustodyAbraod.editLink().click()

    const documenationSource =
      EnterCustodyAbroadDocumentationSource.verifyOnPage<EnterCustodyAbroadDocumentationSource>(
        EnterCustodyAbroadDocumentationSource,
        'Select the documentation that confirms time spent in custody abroad will count towards the sentence',
      )
    documenationSource.selectDocumenationSource('COURT_WARRANT').click()
    documenationSource.submit().click()

    const form = FormPage.verifyOnPage<FormPage>(
      FormPage,
      'Edit the number of days spent in custody abroad that will count towards the sentence',
    )

    form.enterDays('42')
    form.submitButton().click()

    const editOffencesPage = CustodyAbroadEditOffences.verifyOnPage(CustodyAbroadEditOffences)
    editOffencesPage.offenceRadio().first().click({ force: true })
    editOffencesPage.submit().click()

    const confirm = SaveCustodyAbroad.verifyOnPage<SaveCustodyAbroad>(SaveCustodyAbroad, 'Confirm and save')
    confirm.checkOnPage()
    confirm.submit().click()

    hub.successMessage().contains('Time spent in custody abroad details have been updated')
  })

  it('View and delete', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewCustodyAbroadLink().click()
    const viewCustodyAbroad = ViewCustodyAbroad.verifyOnPage<ViewCustodyAbroad>(
      ViewCustodyAbroad,
      'Time spent in custody abroad details',
    )

    viewCustodyAbroad.deleteLink().click()

    const deleteSpecialRemission = DeleteCustodyAbroad.verifyOnPage<DeleteCustodyAbroad>(DeleteCustodyAbroad)
    deleteSpecialRemission.checkOnPage()
    deleteSpecialRemission.deleteButton().click()
    hub.successMessage().contains('16 days of time spent in custody abroad have been deleted')
  })
})

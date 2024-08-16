import HubPage from '../pages/hub'
import FormPage from '../pages/form'
import ReviewTaggedBailPage from '../pages/tagged-bail/reviewTaggedBail'
import ViewTaggedBailPage from '../pages/tagged-bail/viewTaggedBail'
import TaggedBailSelectCasePage from '../pages/tagged-bail/taggedBailSelectCase'
import EditTaggedBailPage from '../pages/tagged-bail/editTaggedBail'
import RemoveTaggedBailPage from '../pages/tagged-bail/removeTaggedBail'

context('Enter Tagged Bail', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('stubGetTaggedBailAdjustment')
    cy.task('subAdaDetailsNoIntercept')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubCreateAdjustment')
    cy.task('stubUpdateAdjustment')
    cy.task('stubDeleteTaggedBailAdjustment')
    cy.task('stubComponents')
    cy.task('stubGetUnusedDeductionsCalculationResult')
  })

  it('Add Tagged Bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.addTaggedBailLink().click()
    const selectOffencesPage = TaggedBailSelectCasePage.verifyOnPage(TaggedBailSelectCasePage)
    selectOffencesPage.selectThisCaseLink().first().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter the amount of tagged bail')
    form.enterDays('10')
    form.submitButton().click()
    const reviewTaggedBail = ReviewTaggedBailPage.verifyOnPage(ReviewTaggedBailPage)
    reviewTaggedBail.submit().click()
    hub.successMessage().contains('10 days of tagged bail have been saved')
  })

  it('View Tagged Bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewTaggedBailLink().click()
    ViewTaggedBailPage.verifyOnPage(ViewTaggedBailPage)
  })

  it('Edit Tagged Bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewTaggedBailLink().click()
    const viewTaggedBailPage = ViewTaggedBailPage.verifyOnPage(ViewTaggedBailPage)
    viewTaggedBailPage.editLink().click()
    let editTaggedBailPage = EditTaggedBailPage.verifyOnPage(EditTaggedBailPage)
    editTaggedBailPage.editLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit the amount of tagged bail')
    form.enterDays('10')
    form.submitButton().click()
    editTaggedBailPage = EditTaggedBailPage.verifyOnPage(EditTaggedBailPage)
    editTaggedBailPage.submit().click()
    hub.successMessage().contains('Tagged bail details have been updated')
  })

  it('Delete Tagged Bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewTaggedBailLink().click()
    const viewTaggedBailPage = ViewTaggedBailPage.verifyOnPage(ViewTaggedBailPage)
    viewTaggedBailPage.deleteLink().click()
    const removeTaggedBailPage = RemoveTaggedBailPage.verifyOnPage(RemoveTaggedBailPage)
    removeTaggedBailPage.submit().click()
    hub.successMessage().contains('25 days of tagged bail have been deleted')
  })
})

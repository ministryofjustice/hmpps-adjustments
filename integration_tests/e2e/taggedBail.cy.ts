import HubPage from '../pages/hub'
import FormPage from '../pages/form'
import ReviewTaggedBailPage from '../pages/reviewTaggedBail'
import ViewTaggedBailPage from '../pages/viewTaggedBail'
import TaggedBailSelectCasePage from '../pages/taggedBailSelectCase'

context('Enter Tagged Bail', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('stubSearchAdjudicationsNoReview')
    cy.task('stubIndividualAdjudicationsNoReview')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubCreateAdjustment')
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
    hub.successMessage().contains('Tagged bail details have been saved')
  })

  it('View Tagged Bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.viewTaggedBailLink().click()
    ViewTaggedBailPage.verifyOnPage(ViewTaggedBailPage)
    // TODO enhance this view test + edit/delete (awaiting redesign tickets)
  })
})

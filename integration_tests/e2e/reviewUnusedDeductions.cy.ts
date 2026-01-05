import HubPage from '../pages/hub'
import FormPage from '../pages/form'
import ReviewUnusedDeductionsPage from '../pages/unused-deductions/reviewUnusedDeductions'
import RemandSelectOffencesPage from '../pages/remand/remandSelectOffences'
import ConfirmEditRemandPage from '../pages/remand/confirmEditRemand'
import RemoveRemandPage from '../pages/remand/removeRemand'
import TaggedBailSelectCasePage from '../pages/tagged-bail/taggedBailSelectCase'
import RemoveTaggedBailPage from '../pages/tagged-bail/removeTaggedBail'
import ConfirmReviewUnusedDeductionsPage from '../pages/unused-deductions/confirmReviewUnusedDeductions'
import EditTaggedBailPage from '../pages/tagged-bail/editTaggedBail'

context('Review Unused Deductions', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetAdjustments')
    cy.task('stubGetRelevantRemand')
    cy.task('stubGetRemandDecision')
    cy.task('stubGetRemandAdjustment')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubCreateAdjustment')
    cy.task('stubUpdateRemandAdjustment')
    cy.task('stubDeleteRemandAdjustment')
    cy.task('stubGetUserCaseloads')
    cy.task('subAdaDetailsNoIntercept')
    cy.task('stubGetUnusedDeductionsCalculationResultNomisAdjustment')
    cy.task('stubSetUnusedDaysManually')
    cy.task('stubDeleteTaggedBailAdjustment')
    cy.task('stubGetTaggedBailAdjustment')
    cy.task('stubComponents')
    cy.task('stubDeleteAdjustment')
    cy.task('stubGetThingsToDo')
    cy.task('stubGetSentenceTypeAndItsDetails')
    cy.task('stubEvictCache')
  })

  it('Review Unused Deductions - Add remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)

    reviewUnusedDeductionsPage.addRemandLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter remand dates')
    form.enterFromDate('2023-04-05')
    form.enterToDate('2023-04-17')
    form.submitButton().click()
    const selectOffencesPage = RemandSelectOffencesPage.verifyOnPage(RemandSelectOffencesPage)
    selectOffencesPage.offenceRadio().first().click({ force: true })
    selectOffencesPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Edit remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)

    reviewUnusedDeductionsPage.editRemandLink().click()
    const confirmEditRemandPage = ConfirmEditRemandPage.verifyOnPage(ConfirmEditRemandPage)
    confirmEditRemandPage.editRemandPeriodLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit remand dates')
    form.clearToAndFromDateFields()
    form.enterFromDate('2023-04-05')
    form.enterToDate('2023-09-05')
    form.submitButton().click()
    ConfirmEditRemandPage.verifyOnPage(ConfirmEditRemandPage)
    confirmEditRemandPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Edit in-session remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)

    reviewUnusedDeductionsPage.addRemandLink().click()
    let form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter remand dates')
    form.enterFromDate('2023-04-05')
    form.enterToDate('2023-04-17')
    form.submitButton().click()
    const selectOffencesPage = RemandSelectOffencesPage.verifyOnPage(RemandSelectOffencesPage)
    selectOffencesPage.offenceRadio().first().click({ force: true })
    selectOffencesPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.editRemandLink().eq(1).click()
    const confirmEditRemandPage = ConfirmEditRemandPage.verifyOnPage(ConfirmEditRemandPage)
    confirmEditRemandPage.editRemandPeriodLink().click()
    form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit remand dates')
    form.clearToAndFromDateFields()
    form.enterFromDate('2023-04-05')
    form.enterToDate('2023-09-05')
    form.submitButton().click()
    ConfirmEditRemandPage.verifyOnPage(ConfirmEditRemandPage)
    confirmEditRemandPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Delete remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.deleteRemandLink().click()
    const removeRemandPage = RemoveRemandPage.verifyOnPage(RemoveRemandPage)
    removeRemandPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Delete in-session remand', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)

    reviewUnusedDeductionsPage.addRemandLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter remand dates')
    form.enterFromDate('2023-04-05')
    form.enterToDate('2023-04-17')
    form.submitButton().click()
    const selectOffencesPage = RemandSelectOffencesPage.verifyOnPage(RemandSelectOffencesPage)
    selectOffencesPage.offenceRadio().first().click({ force: true })
    selectOffencesPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.deleteRemandLink().eq(1).click()
    const removeRemandPage = RemoveRemandPage.verifyOnPage(RemoveRemandPage)
    removeRemandPage.submit().click()
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Add tagged bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.addTaggedBailLink().click()
    const selectOffencesPage = TaggedBailSelectCasePage.verifyOnPage(TaggedBailSelectCasePage)
    selectOffencesPage.selectThisCaseLink().first().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter the amount of tagged bail')
    form.enterDays('10')
    form.submitButton().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Edit tagged bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.editTaggedBailLink().click()
    const editTaggedBailPage = EditTaggedBailPage.verifyOnPage(EditTaggedBailPage)
    editTaggedBailPage.editLink().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit the amount of tagged bail')
    form.enterDays('10')
    form.submitButton().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Edit in-session tagged bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.addTaggedBailLink().click()
    const selectOffencesPage = TaggedBailSelectCasePage.verifyOnPage(TaggedBailSelectCasePage)
    selectOffencesPage.selectThisCaseLink().first().click()
    let form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter the amount of tagged bail')
    form.enterDays('10')
    form.submitButton().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.editTaggedBailLink().eq(1).click()
    const editTaggedBailPage = EditTaggedBailPage.verifyOnPage(EditTaggedBailPage)
    editTaggedBailPage.editLink().click()
    form = FormPage.verifyOnPage<FormPage>(FormPage, 'Edit the amount of tagged bail')
    form.enterDays('20')
    form.submitButton().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Delete tagged bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.deleteTaggedBailLink().click()
    const removeTaggedBailPage = RemoveTaggedBailPage.verifyOnPage(RemoveTaggedBailPage)
    removeTaggedBailPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })

  it('Review Unused Deductions - Delete in-session tagged bail', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.reviewUnusedDeductionsLink().click()
    const reviewUnusedDeductionsPage = ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.addTaggedBailLink().click()
    const selectOffencesPage = TaggedBailSelectCasePage.verifyOnPage(TaggedBailSelectCasePage)
    selectOffencesPage.selectThisCaseLink().first().click()
    const form = FormPage.verifyOnPage<FormPage>(FormPage, 'Enter the amount of tagged bail')
    form.enterDays('10')
    form.submitButton().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.deleteTaggedBailLink().eq(1).click()
    const removeTaggedBailPage = RemoveTaggedBailPage.verifyOnPage(RemoveTaggedBailPage)
    removeTaggedBailPage.submit().click()
    ReviewUnusedDeductionsPage.verifyOnPage(ReviewUnusedDeductionsPage)
    reviewUnusedDeductionsPage.submit().click()
    const confirmReviewUnusedDeductionsPage = ConfirmReviewUnusedDeductionsPage.verifyOnPage(
      ConfirmReviewUnusedDeductionsPage,
    )
    confirmReviewUnusedDeductionsPage.submit().click()
    HubPage.verifyOnPage(HubPage)
  })
})

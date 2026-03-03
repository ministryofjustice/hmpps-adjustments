import ReviewPreviousUalPage from '../pages/reviewPreviousUalPage'
import ReviewPreviousUalToApplyPage from '../pages/reviewPreviousUalToApplyPage'
import Page from '../pages/page'
import HubPage from '../pages/hub'
import ConfirmRejectPreviousUalPage from '../pages/confirmRejectPreviousUalPage'

context('Review UAL from a previous period of custody', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubComponents')
    cy.task('subAdaDetailsNoIntercept')
    cy.task('stubGetSentencesAndOffences')
    cy.task('stubGetThingsToDo')
    cy.task('stubEvictCache')
    cy.task('stubGetAdjustments')
    cy.task('stubGetSentenceTypeAndItsDetails')
    cy.task('stubGetUnusedDeductionsCalculationResult')
    cy.task('stubGetPreviousPeriodsOfUal')
    cy.task('stubPutPreviousPeriodsOfUal')
  })

  it('Can accept some previous periods of UAL', () => {
    cy.signIn()

    ReviewPreviousUalPage.goTo('A1234AB')
      .hasPeriod('1')
      .hasPeriod('2')
      .hasPeriod('3')
      .hasPeriod('4')
      .hasPeriod('5')
      .selectPeriod('1')
      .selectPeriod('5')
      .clickContinue()

    Page.verifyOnPage(ReviewPreviousUalToApplyPage)
      .hasPeriod('1')
      .doesNotHavePeriod('2')
      .doesNotHavePeriod('3')
      .doesNotHavePeriod('4')
      .hasPeriod('5')
      .hasTotal(10)
      .clickContinue()

    const hub = Page.verifyOnPage(HubPage)
    hub.successMessage().contains('10 days of UAL have been saved')
  })

  it('Can reject all previous periods of UAL', () => {
    cy.signIn()

    ReviewPreviousUalPage.goTo('A1234AB')
      .hasPeriod('1')
      .hasPeriod('2')
      .hasPeriod('3')
      .hasPeriod('4')
      .hasPeriod('5')
      .selectNoneApply()
      .clickContinue()

    Page.verifyOnPage(ConfirmRejectPreviousUalPage) //
      .selectNo()
      .clickContinue()

    Page.verifyOnPage(ReviewPreviousUalPage) //
      .selectNoneApply()
      .clickContinue()

    Page.verifyOnPage(ConfirmRejectPreviousUalPage) //
      .selectYes()
      .clickContinue()

    const hub = Page.verifyOnPage(HubPage)
    hub.successMessage().should('not.exist')
  })

  it('Back links work', () => {
    cy.signIn()

    ReviewPreviousUalPage.goTo('A1234AB') //
      .selectNoneApply()
      .clickContinue()

    Page.verifyOnPage(ConfirmRejectPreviousUalPage) //
      .clickBack()

    Page.verifyOnPage(ReviewPreviousUalPage) //
      .selectPeriod('1')
      .clickContinue()

    Page.verifyOnPage(ReviewPreviousUalToApplyPage) //
      .clickBack()

    Page.verifyOnPage(ReviewPreviousUalPage) //
      .clickBack()

    Page.verifyOnPage(HubPage)
  })

  it('Can cancel from review previous periods', () => {
    cy.signIn()

    ReviewPreviousUalPage.goTo('A1234AB') //
      .hasPeriod('1')
      .clickCancel()

    Page.verifyOnPage(HubPage)
  })

  it('Can cancel from review UAL to apply', () => {
    cy.signIn()

    ReviewPreviousUalPage.goTo('A1234AB') //
      .hasPeriod('1')
      .selectPeriod('1')
      .clickContinue()

    Page.verifyOnPage(ReviewPreviousUalToApplyPage) //
      .clickCancel()

    Page.verifyOnPage(HubPage)
  })

  it('Can cancel from reject previous UAL', () => {
    cy.signIn()

    ReviewPreviousUalPage.goTo('A1234AB') //
      .hasPeriod('1')
      .selectNoneApply()
      .clickContinue()

    Page.verifyOnPage(ConfirmRejectPreviousUalPage) //
      .clickCancel()

    Page.verifyOnPage(HubPage)
  })
})

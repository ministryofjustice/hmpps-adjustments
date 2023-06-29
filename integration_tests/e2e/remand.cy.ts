import HubPage from '../pages/hub'

context('Enter a RADA', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetUserCaseloads')
    cy.task('stubGetAdjustments')
    cy.task('stubGetRelevantRemand')
  })

  it('Enter a RADA', () => {
    cy.signIn()
    const hub = HubPage.goTo('A1234AB')
    hub.relevantRemandLink().should('have.attr', 'href').should('not.be.empty').and('equals', '/A1234AB/remand')
    hub.relevantRemandMessage().should('contain.text', `59 days remand`)
  })
})

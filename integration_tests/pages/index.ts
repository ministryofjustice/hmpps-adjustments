import AdjustmentsPage from './adjustmentsPage'
import Page, { PageElement } from './page'

export default class IndexPage extends AdjustmentsPage {
  constructor() {
    super('This site is under construction...')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  courtRegisterLink = (): PageElement => cy.get('[href="/court-register"]')
}

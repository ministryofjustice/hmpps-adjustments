import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class IndexPage extends AdjustmentsPage {
  constructor() {
    super('This site is under construction...')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  courtRegisterLink = (): PageElement => cy.get('[href="/court-register"]')

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  commonComponentsHeader = (): PageElement => cy.get('[data-qa=common-header]')

  designLibraryFooter = (): PageElement => cy.get('[data-qa=ccrds-footer]')
}

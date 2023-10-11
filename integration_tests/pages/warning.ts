import AdjustmentsPage from './adjustmentsPage'
import Page, { PageElement } from './page'

export default class WarningPage extends AdjustmentsPage {
  constructor(title: string) {
    super(title)
  }

  public yesRadio = (): PageElement => cy.get('[value=yes]')

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

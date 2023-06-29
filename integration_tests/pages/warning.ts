import Page, { PageElement } from './page'

export default class WarningPage extends Page {
  constructor(title: string) {
    super(title)
  }

  public yesRadio = (): PageElement => cy.get('[value=yes]')

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class CustodyAbroadEditOffences extends AdjustmentsPage {
  constructor() {
    super('Edit offences')
  }

  public offenceRadio = (): PageElement => cy.get('[value=111]')

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

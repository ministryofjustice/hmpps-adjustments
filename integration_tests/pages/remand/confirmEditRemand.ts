import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ConfirmEditRemandPage extends AdjustmentsPage {
  constructor() {
    super('Confirm and save')
  }

  public editRemandPeriodLink = (): PageElement => cy.get('[data-qa=edit-remand-period]')

  public editRemandOffencesLink = (): PageElement => cy.get('[data-qa=edit-remand-offences]')

  public submit = (): PageElement => cy.get('[data-qa=save-button]')
}

import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class AppealApplicantSelectOffencesPage extends AdjustmentsPage {
  constructor() {
    super('Select the offences')
  }

  public offenceRadio = (): PageElement => cy.get('[value=111]')

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

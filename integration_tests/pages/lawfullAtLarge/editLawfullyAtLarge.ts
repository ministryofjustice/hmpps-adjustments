import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class EditLawfullyAtLargePage extends AdjustmentsPage {
  constructor() {
    super('Edit LAL details')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class SaveRemandPage extends AdjustmentsPage {
  constructor() {
    super('Save remand details')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

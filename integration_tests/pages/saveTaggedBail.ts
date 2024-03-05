import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class SaveTaggedBailPage extends AdjustmentsPage {
  constructor() {
    super('Confirm and save')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class ReviewTaggedBailPage extends AdjustmentsPage {
  constructor() {
    super('Confirm and save')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class EditRemandPage extends AdjustmentsPage {
  constructor() {
    super('Edit remand')
  }

  public editLink = (): PageElement => cy.get('a.govuk-link').first()
}

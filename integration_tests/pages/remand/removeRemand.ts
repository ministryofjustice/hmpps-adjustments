import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class RemoveRemandPage extends AdjustmentsPage {
  constructor() {
    super('Delete remand')
  }

  public submit = (): PageElement => cy.get('[data-qa=remove-button]')
}

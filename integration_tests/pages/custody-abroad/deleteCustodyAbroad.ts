import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class DeleteCustodyAbroad extends AdjustmentsPage {
  constructor() {
    super('Delete time spent in custody abroad')
  }

  public deleteButton = (): PageElement => cy.get('[data-qa=remove-button]')
}

import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class DeleteSpecialRemission extends AdjustmentsPage {
  constructor() {
    super('Delete special remission')
  }

  public deleteButton = (): PageElement => cy.get('[data-qa=remove-button]')
}

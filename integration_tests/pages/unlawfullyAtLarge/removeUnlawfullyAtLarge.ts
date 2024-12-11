import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class RemoveUnlawfullyAtLargePage extends AdjustmentsPage {
  constructor() {
    super('Delete UAL')
  }

  public submit = (): PageElement => cy.get('[data-qa=remove-button]')
}

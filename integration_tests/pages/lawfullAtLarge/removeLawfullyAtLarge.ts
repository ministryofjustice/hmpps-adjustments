import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class RemoveLawfullyAtLargePage extends AdjustmentsPage {
  constructor() {
    super('Delete LAL')
  }

  public submit = (): PageElement => cy.get('[data-qa=remove-button]')
}

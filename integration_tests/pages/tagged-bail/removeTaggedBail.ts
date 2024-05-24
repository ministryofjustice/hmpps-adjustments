import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class RemoveTaggedBailPage extends AdjustmentsPage {
  constructor() {
    super('Delete tagged bail')
  }

  public submit = (): PageElement => cy.get('[data-qa=remove-button]')
}

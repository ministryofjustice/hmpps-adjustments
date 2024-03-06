import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class RemoveTaggedBailPage extends AdjustmentsPage {
  constructor() {
    super('Delete Tagged Bail details')
  }

  public submit = (): PageElement => cy.get('[data-qa=remove-button]')
}

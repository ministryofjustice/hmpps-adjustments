import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ViewUnlawfullyAtLargePage extends AdjustmentsPage {
  constructor() {
    super('UAL overview')
  }

  public editLink = (): PageElement => cy.get('[data-qa=edit-ual-626a0e7-5eae-4ced-a10d-8e3bce9c522c]')

  public deleteLink = (): PageElement => cy.get('[data-qa=remove-ual-626a0e7-5eae-4ced-a10d-8e3bce9c522c]')

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

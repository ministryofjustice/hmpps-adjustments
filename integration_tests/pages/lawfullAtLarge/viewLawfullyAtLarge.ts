import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ViewLawfullyAtLargePage extends AdjustmentsPage {
  constructor() {
    super('LAL overview')
  }

  public editLink = (): PageElement => cy.get('[data-qa=edit-e626a0e7-5eae-4ced-a10d-8e3bce9c522c]')

  public deleteLink = (): PageElement => cy.get('[data-qa=remove-e626a0e7-5eae-4ced-a10d-8e3bce9c522c]')

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

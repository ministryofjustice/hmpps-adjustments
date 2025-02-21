import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ViewCustodyAbroad extends AdjustmentsPage {
  constructor() {
    super('Time spent in custody abroad details')
  }

  public editLink = (): PageElement => cy.get('[data-qa=edit-37bb9690-0977-4804-b766-559f7e1d5084]')

  public deleteLink = (): PageElement => cy.get('[data-qa=remove-37bb9690-0977-4804-b766-559f7e1d5084]')

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

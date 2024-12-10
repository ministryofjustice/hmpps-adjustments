import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ViewSpecialRemission extends AdjustmentsPage {
  constructor() {
    super('Special remission details')
  }

  public editLink = (): PageElement => cy.get('[data-qa=edit-8f390784-1bd2-4bb8-8e91-9d487c8e8b28]')

  public deleteLink = (): PageElement => cy.get('[data-qa=remove-8f390784-1bd2-4bb8-8e91-9d487c8e8b28]')

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

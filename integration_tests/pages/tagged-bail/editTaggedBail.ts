import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class EditTaggedBailPage extends AdjustmentsPage {
  constructor() {
    super('Edit tagged bail')
  }

  public editLink = (): PageElement => cy.get('a.govuk-link').eq(1)

  public submit = (): PageElement => cy.get('[data-qa=save-button]')
}

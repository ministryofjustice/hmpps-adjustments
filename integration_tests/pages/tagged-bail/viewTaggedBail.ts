import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ViewTaggedBailPage extends AdjustmentsPage {
  constructor() {
    super('Tagged bail overview')
  }

  public editLink = (): PageElement => cy.get('a.govuk-link').first()

  public deleteLink = (): PageElement => cy.get('a.govuk-link').eq(1)
}

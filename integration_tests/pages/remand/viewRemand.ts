import AdjustmentsPage, { PageElement } from '../adjustmentsPage'

export default class ViewRemandPage extends AdjustmentsPage {
  constructor() {
    super('Remand overview')
  }

  public editLink = (): PageElement => cy.get('a.govuk-link').first()

  public deleteLink = (): PageElement => cy.get('a.govuk-link').eq(1)
}

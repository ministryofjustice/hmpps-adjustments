import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class ViewPage extends AdjustmentsPage {
  constructor(title: string) {
    super(title)
  }

  public editLink = (id: string): PageElement => cy.get(`[data-qa=edit-${id}]`)

  public removeLink = (id: string): PageElement => cy.get(`[data-qa=remove-${id}]`)

  public table = (): PageElement => cy.get('[data-qa=view-table]')
}

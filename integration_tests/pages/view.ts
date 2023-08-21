import Page, { PageElement } from './page'

export default class ViewPage extends Page {
  constructor(title: string) {
    super(title)
  }

  public skipAxe() {
    return false
  }

  public editLink = (id: string): PageElement => cy.get(`[data-qa=edit-${id}]`)

  public removeLink = (id: string): PageElement => cy.get(`[data-qa=remove-${id}]`)

  public table = (): PageElement => cy.get('[data-qa=view-table]')
}

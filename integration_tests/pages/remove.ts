import Page, { PageElement } from './page'

export default class RemovePage extends Page {
  constructor(title: string) {
    super(title)
  }

  public skipAxe() {
    return false
  }

  public removeButton = (): PageElement => cy.get(`[data-qa=remove-button]`)
}

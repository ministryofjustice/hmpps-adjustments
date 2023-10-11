import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class RemovePage extends AdjustmentsPage {
  constructor(title: string) {
    super(title)
  }

  public removeButton = (): PageElement => cy.get(`[data-qa=remove-button]`)
}

import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class PadaPage extends AdjustmentsPage {
  constructor() {
    super('Review PADAs')
  }

  public checkboxByIndex(index: number): PageElement {
    return cy.get(`.row-checkbox:eq(${index})`)
  }

  public noneSelectedCheckbox(): PageElement {
    return cy.get('#unselect-all')
  }

  public continueButton = (): PageElement => cy.get('[data-qa=continue-button]')
}

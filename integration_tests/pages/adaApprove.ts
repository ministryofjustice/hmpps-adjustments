import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class AdaAprovePage extends AdjustmentsPage {
  constructor() {
    super('Review and approve ADAs')
  }

  public approveButton = (): PageElement => cy.get('[data-qa=approve-button]')
}

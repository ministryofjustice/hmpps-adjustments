import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class NoContinueSpecialRemission extends AdjustmentsPage {
  constructor() {
    super('You cannot continue')
  }

  public returnToHomepage = (): PageElement => cy.get('[data-qa=return-to-homepage]')
}

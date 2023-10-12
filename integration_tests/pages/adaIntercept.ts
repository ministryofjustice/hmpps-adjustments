import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class AdaInterceptPage extends AdjustmentsPage {
  constructor() {
    super('Review adjustment information')
  }

  public static goTo(prisonerId: string): AdaInterceptPage {
    cy.visit(`/${prisonerId}`)
    return new AdaInterceptPage()
  }

  public reviewLink = (): PageElement => cy.get('[data-qa=review-link]')
}

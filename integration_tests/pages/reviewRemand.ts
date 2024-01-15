import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class ReviewRemandPage extends AdjustmentsPage {
  constructor() {
    super('Review remand details')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')

  public noMoreRemandRadio = (): PageElement => cy.get('[value=no]')
}

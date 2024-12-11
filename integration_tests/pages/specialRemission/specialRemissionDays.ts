import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class specialRemissionDays extends AdjustmentsPage {
  constructor() {
    super('Enter the number of special remission days')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

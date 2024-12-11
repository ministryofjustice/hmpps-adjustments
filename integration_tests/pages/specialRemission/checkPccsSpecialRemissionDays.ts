import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class CheckPccsSpecialRemissionDays extends AdjustmentsPage {
  constructor() {
    super('Has PPCS provided the number of special remission days')
  }

  public selectYes = (): PageElement => cy.get('[value=yes]')

  public selectNo = (): PageElement => cy.get('[value=no]')

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

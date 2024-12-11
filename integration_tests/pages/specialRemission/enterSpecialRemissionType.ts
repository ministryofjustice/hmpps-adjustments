import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class EnterSpecialRemissionType extends AdjustmentsPage {
  constructor() {
    super('Select the type of special remission')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')

  public selectRemissionType = (type: string): PageElement => cy.get(`[value=${type}]`)
}

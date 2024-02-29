import AdjustmentsPage from './adjustmentsPage'
import { PageElement } from './page'

export default class SaveRemandPage extends AdjustmentsPage {
  constructor() {
    super('Adjust release dates')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

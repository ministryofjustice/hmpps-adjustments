import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class TaggedBailSelectCasePage extends AdjustmentsPage {
  constructor() {
    super('Select the case for this tagged bail')
  }

  public selectThisCaseLink = (): PageElement => cy.get('a.govuk-link')

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

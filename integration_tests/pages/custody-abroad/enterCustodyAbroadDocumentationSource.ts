import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class EnterCustodyAbroadDocumentationSource extends AdjustmentsPage {
  constructor() {
    super('Select the documentation that confirms time spent in custody abroad will count towards the sentence\n')
  }

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')

  public selectDocumenationSource = (type: string): PageElement => cy.get(`[value=${type}]`)
}

import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ReviewUnusedDeductionsPage extends AdjustmentsPage {
  constructor() {
    super('Review and approve')
  }

  public addTaggedBailLink = (): PageElement => cy.get('[data-qa=add-tagged-bail]')

  public editTaggedBailLink = (): PageElement => cy.get('[data-qa=edit-tagged-bail]')

  public deleteTaggedBailLink = (): PageElement => cy.get('[data-qa=delete-tagged-bail]')

  public addRemandLink = (): PageElement => cy.get('[data-qa=add-remand]')

  public editRemandLink = (): PageElement => cy.get('[data-qa=edit-remand]')

  public deleteRemandLink = (): PageElement => cy.get('[data-qa=delete-remand]')

  public submit = (): PageElement => cy.get('[data-qa=submit-form]')
}

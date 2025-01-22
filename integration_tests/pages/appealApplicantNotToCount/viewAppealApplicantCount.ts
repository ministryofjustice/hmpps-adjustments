import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class ViewAppealApplicantCountPage extends AdjustmentsPage {
  constructor() {
    super('Time spent as an appeal applicant not to count overview')
  }

  public editLink = (): PageElement => cy.get('[data-qa=edit-aa-8f390784-1bd2-4bb8-8e91-9d487c8e8b28]')

  public deleteLink = (): PageElement => cy.get('[data-qa=remove-aa-8f390784-1bd2-4bb8-8e91-9d487c8e8b28]')

  public submit = (): PageElement => cy.get('[data-qa=submit]')
}

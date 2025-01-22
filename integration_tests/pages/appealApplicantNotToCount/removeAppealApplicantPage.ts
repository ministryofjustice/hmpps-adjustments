import AdjustmentsPage from '../adjustmentsPage'
import { PageElement } from '../page'

export default class RemoveAppealApplicantPage extends AdjustmentsPage {
  constructor() {
    super('Delete time spent as an appeal applicant not to count')
  }

  public submit = (): PageElement => cy.get('[data-qa=remove-button]')
}

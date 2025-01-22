import FormPage from '../form'
import { PageElement } from '../page'

export default class AppealApplicantCountDaysFormPage extends FormPage {
  constructor(title: string) {
    super(title)
  }

  public enterDaysSpentAppealApplicant = (value: string): PageElement => cy.get('[id=days]').type(String(value))
}

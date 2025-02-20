import FormPage from '../form'
import { PageElement } from '../page'

export default class AppealApplicantCountCourtRefNumFormPage extends FormPage {
  constructor(title: string) {
    super(title)
  }

  public enterCourtRefNumber = (value: string): PageElement => cy.get('[id=reference]').type(String(value))
}

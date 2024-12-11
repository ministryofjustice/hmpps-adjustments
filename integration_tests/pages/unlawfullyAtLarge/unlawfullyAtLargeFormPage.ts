import FormPage from '../form'
import { PageElement } from '../page'

export default class UnlawfullyAtLargeFormPage extends FormPage {
  constructor(title: string) {
    super(title)
  }

  public selectUALType = (): PageElement => cy.get('[value=RECALL]')
}

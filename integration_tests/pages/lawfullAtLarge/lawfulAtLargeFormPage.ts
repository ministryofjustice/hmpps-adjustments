import FormPage from '../form'
import { PageElement } from '../page'

export default class LawfulAtLargeFormPage extends FormPage {
  constructor(title: string) {
    super(title)
  }

  public affectsDatesRadio = (): PageElement => cy.get('[value=YES]')
}

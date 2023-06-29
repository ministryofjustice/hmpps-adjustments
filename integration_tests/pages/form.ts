import dayjs from 'dayjs'
import Page, { PageElement } from './page'

export default class FormPage extends Page {
  constructor(title: string) {
    super(title)
  }

  skipAxe = (): boolean => false

  public enterFromDate = (date: string): void => {
    const days = dayjs(date).get('date').toString()
    const months = (dayjs(date).get('month') + 1).toString()
    const years = dayjs(date).get('year').toString()

    cy.get('[name=from-day]').type(days)
    cy.get('[name=from-month]').type(months)
    cy.get('[name=from-year]').type(years)
  }

  public enterDays = (days: string): void => {
    cy.get('[name=days]').type(days)
  }

  public submitButton = (): PageElement => cy.get('[data-qa=submit-form]')
}

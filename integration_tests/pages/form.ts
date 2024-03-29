import dayjs from 'dayjs'
import { PageElement } from './page'
import AdjustmentsPage from './adjustmentsPage'

export default class FormPage extends AdjustmentsPage {
  constructor(title: string) {
    super(title)
  }

  public clearToAndFromDateFields = (): void => {
    cy.get('[name=from-day]').clear()
    cy.get('[name=from-month]').clear()
    cy.get('[name=from-year]').clear()
    cy.get('[name=to-day]').clear()
    cy.get('[name=to-month]').clear()
    cy.get('[name=to-year]').clear()
  }

  public enterFromDate = (date: string): void => {
    const days = dayjs(date).get('date').toString()
    const months = (dayjs(date).get('month') + 1).toString()
    const years = dayjs(date).get('year').toString()

    cy.get('[name=from-day]').type(days)
    cy.get('[name=from-month]').type(months)
    cy.get('[name=from-year]').type(years)
  }

  public enterToDate = (date: string): void => {
    const days = dayjs(date).get('date').toString()
    const months = (dayjs(date).get('month') + 1).toString()
    const years = dayjs(date).get('year').toString()

    cy.get('[name=to-day]').type(days)
    cy.get('[name=to-month]').type(months)
    cy.get('[name=to-year]').type(years)
  }

  public enterDays = (days: string): void => {
    cy.get('[name=days]').clear()
    cy.get('[name=days]').type(days)
  }

  public submitButton = (): PageElement => cy.get('[data-qa=submit-form]')
}

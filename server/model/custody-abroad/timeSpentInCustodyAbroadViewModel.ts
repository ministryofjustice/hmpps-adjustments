import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'

export default class TimeSpentInCustodyAbroadViewModel {
  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
  ) {}

  public backlink(): string {
    return `/${this.prisonerNumber}`
  }

  public columnHeadings() {
    return [{ text: 'Entered by' }, { text: 'Type' }, { text: 'Days' }, { text: 'Actions' }]
  }

  public rows() {
    return this.adjustments.map(it => {
      const displayText = it.timeSpentInCustodyAbroad
        ? timeSpentInCustodyAbroadDocumentationSource.find(
            tsica => tsica.value === it.timeSpentInCustodyAbroad.documentationSource,
          ).text
        : 'Unknown'
      return [{ text: it.prisonName }, { text: displayText }, { text: it.days }, this.actionCell(it)]
    })
  }

  public table() {
    return {
      head: this.columnHeadings(),
      rows: this.rows().concat(this.totalRow()),
      attributes: { 'data-qa': 'view-table' },
    }
  }

  public totalRow() {
    const total = this.adjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    return [[{ html: '<b>Total days</b>' }, { html: '' }, { html: `<b>${total}</b>` }]]
  }

  private actionCell(adjustment: Adjustment) {
    const visuallyHiddenText = `${adjustment.days} of time spent in custody abroad`
    return {
      html: `
      <div class="govuk-grid-column-one-quarter govuk-!-margin-right-2 govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/custody-abroad/documentation/edit/${adjustment.id}" data-qa="edit-${adjustment.id}">Edit<span class="govuk-visually-hidden"> ${visuallyHiddenText}</span></a><br />
      </div>
      <div class="govuk-grid-column-one-half govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/custody-abroad/remove/${adjustment.id}" data-qa="remove-${adjustment.id}">Delete<span class="govuk-visually-hidden"> ${visuallyHiddenText}</span></a><br />
      </div>
    `,
    }
  }
}

import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import UnusedDeductionsMessageViewModel from './unusedDeductionsMessageViewModel'
import specialRemissionType from './specialRemissionType'

export default class SpecialRemissionViewModel {
  public unusedDeductionMessage: UnusedDeductionsMessageViewModel

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
      const displayText = specialRemissionType.find(srem => srem.value === it.specialRemission.type).text
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
    return {
      html: `
      <div class="govuk-grid-column-one-quarter govuk-!-margin-right-2 govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/special-remission/check/edit/${adjustment.id}" data-qa="edit-${adjustment.id}">Edit</a><br />
      </div>
      <div class="govuk-grid-column-one-half govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/special-remission/remove/${adjustment.id}" data-qa="delete-${adjustment.id}">Delete</span></a><br />
      </div>
    `,
    }
  }
}

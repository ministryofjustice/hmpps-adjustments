import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'

export default class TimeSpentAsAnAppealApplicantViewModel {
  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
  ) {}

  public backlink(): string {
    return `/${this.prisonerNumber}`
  }

  public columnHeadings() {
    return [
      { text: 'Entered by' },
      { text: 'Court of Appeal reference number' },
      { text: 'Number of Days' },
      { text: 'Actions' },
    ]
  }

  public rows() {
    return this.adjustments.map(it => {
      return [
        { text: it.prisonName },
        { text: it.timeSpentAsAnAppealApplicantNotToCount?.courtOfAppealReferenceNumber || 'Unknown' },
        { text: it.days },
        this.actionCell(it),
      ]
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
    const visuallyHiddenText = `${adjustment.days} of time spent as an appeal applicant not to count`
    return {
      html: `
      <div class="govuk-grid-column-one-quarter govuk-!-margin-right-2 govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/appeal-applicant/days/edit/${adjustment.id}" data-qa="edit-${adjustment.id}">Edit<span class="govuk-visually-hidden"> ${visuallyHiddenText}</span></a><br />
      </div>
      <div class="govuk-grid-column-one-half govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/appeal-applicant/remove/${adjustment.id}" data-qa="remove-${adjustment.id}">Delete<span class="govuk-visually-hidden"> ${visuallyHiddenText}</span></a><br />
      </div>
    `,
    }
  }
}

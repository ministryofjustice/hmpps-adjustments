import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { getSummaryHtmlForOffences, offencesForTimeSpentInCustodyAbroadAdjustment } from '../../utils/utils'

export default class TimeSpentInCustodyAbroadViewModel {
  constructor(
    public nomsId: string,
    public adjustments: Adjustment[],
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public backlink(): string {
    return `/${this.nomsId}`
  }

  public columnHeadings() {
    return [
      { text: 'Type', classes: 'govuk-!-width-one-third' },
      { text: 'Offences', classes: 'govuk-!-width-one-third' },
      { text: 'Entered by' },
      { text: 'Days' },
      { text: 'Actions' },
    ]
  }

  public rows() {
    return this.adjustments.map(it => {
      const displayText = it.timeSpentInCustodyAbroad
        ? timeSpentInCustodyAbroadDocumentationSource.find(
            tsica => tsica.value === it.timeSpentInCustodyAbroad.documentationSource,
          ).text
        : 'Unknown'
      return [
        { text: displayText },
        { html: this.offenceSummary(it) },
        { text: it.prisonName },
        { text: it.days },
        this.actionCell(it),
      ]
    })
  }

  public offenceSummary(adjustment: Adjustment): string {
    const offences = offencesForTimeSpentInCustodyAbroadAdjustment(adjustment, this.sentencesAndOffences)
    return getSummaryHtmlForOffences(offences)
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
    return [[{ html: '<b>Total days</b>' }, { html: '' }, { html: '' }, { html: `<b>${total}</b>` }, { html: '' }]]
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

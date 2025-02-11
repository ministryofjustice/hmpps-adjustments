import dayjs from 'dayjs'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { offencesForTimeSpentInCustodyAbroadAdjustment } from '../../utils/utils'

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
      { text: 'Entered by' },
      { text: 'Type', classes: 'govuk-!-width-one-third' },
      { text: 'Days' },
      { text: 'Offences', classes: 'govuk-!-width-one-third' },
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
        { text: it.prisonName },
        { text: displayText },
        { text: it.days },
        { html: this.offenceSummary(it) },
        this.actionCell(it),
      ]
    })
  }

  public offenceSummary(adjustment: Adjustment): string {
    const offences = offencesForTimeSpentInCustodyAbroadAdjustment(adjustment, this.sentencesAndOffences)
    return `<div>
                    ${offences
                      .map(it => {
                        return `<div><span class="govuk-!-font-weight-bold">${it.offenceDescription}</span><br>
                        <span class="govuk-body-s">
                          ${this.getCommittedText(it, true)}
                        </span><br>
                        <span class="govuk-body-s">
                          ${this.getHeardAtCourt(it)}
                        </span>
                        </div>`
                      })
                      .join('')}
                  </div>`
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

  public getCommittedText(offence: PrisonApiOffence, noWrapDate: boolean): string {
    let committedText
    if (offence.offenceEndDate && offence.offenceStartDate && offence.offenceEndDate !== offence.offenceStartDate) {
      committedText = `Committed from ${this.formatDate(offence.offenceStartDate, noWrapDate)} to ${this.formatDate(offence.offenceEndDate, noWrapDate)}`
    } else if (offence.offenceStartDate) {
      committedText = `Committed on ${this.formatDate(offence.offenceStartDate, noWrapDate)}`
    } else if (offence.offenceEndDate) {
      committedText = `Committed on ${this.formatDate(offence.offenceEndDate, noWrapDate)}`
    } else {
      committedText = 'Offence date not entered'
    }
    return committedText
  }

  private formatDate(date: string, noWrapDate: boolean) {
    const formattedDate = dayjs(date).format('D MMMM YYYY')
    return noWrapDate ? `<span class="govuk-!-white-space-nowrap">${formattedDate}</span> ` : formattedDate
  }

  public getHeardAtCourt(offence: PrisonApiOffence & { courtDescription: string }): string {
    return `Heard at ${offence.courtDescription}`
  }
}

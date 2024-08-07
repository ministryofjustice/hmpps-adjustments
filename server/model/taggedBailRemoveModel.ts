import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateToString, getSentenceRecallTagHTML, isSentenceRecalled } from '../utils/utils'

export default class TaggedBailRemoveModel {
  constructor(
    public prisonerNumber: string,
    public adjustment: Adjustment,
    public sentenceAndOffence: PrisonApiOffenderSentenceAndOffences,
    public showUnusedMessage: boolean,
    public reviewDeductions?: boolean,
  ) {}

  public backlink(): string {
    if (this.reviewDeductions) {
      return `/${this.prisonerNumber}/unused-deductions/review-deductions`
    }

    return `/${this.prisonerNumber}`
  }

  public rows() {
    return [
      [
        { text: 'Case details' },
        {
          html: `${this.getCourtName()} <span class="vertical-bar"></span> ${this.getCaseReference()} ${isSentenceRecalled(this.sentenceAndOffence.sentenceCalculationType) ? getSentenceRecallTagHTML() : ''}<br>${this.getSentenceDate()}`,
        },
      ],
      [{ text: 'Number of days' }, { text: this.getTaggedBailDays() }],
    ]
  }

  public table() {
    return {
      rows: this.rows(),
      attributes: { 'data-qa': 'view-table' },
      firstCellIsHeader: true,
    }
  }

  private getCourtName(): string {
    if (this.sentenceAndOffence) {
      return this.sentenceAndOffence.courtDescription
    }

    return null
  }

  private getTaggedBailDays(): number {
    if (this.adjustment) {
      return this.adjustment.days
    }

    return null
  }

  private getSentenceDate(): string {
    if (this.sentenceAndOffence) {
      return dateToString(new Date(this.sentenceAndOffence.sentenceDate))
    }

    return null
  }

  private getCaseReference(): string {
    if (this.sentenceAndOffence) {
      return this.sentenceAndOffence.caseReference || ''
    }

    return null
  }
}

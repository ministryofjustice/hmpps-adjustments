import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateToString, getSentenceRecallTagHTML, isSentenceRecalled } from '../utils/utils'

export default class TaggedBailRemoveModel {
  constructor(
    public prisonerNumber: string,
    public adjustment: Adjustment,
    public sentenceAndOffence: PrisonApiOffenderSentenceAndOffences,
    public showUnusedMessage: boolean,
  ) {}

  public backlink(): string {
    return `/${this.prisonerNumber}`
  }

  public rows() {
    const caseDetailsHTML = isSentenceRecalled(this.sentenceAndOffence.sentenceCalculationType)
      ? {
          html: `${this.getCourtName()} ${getSentenceRecallTagHTML()}<br>${this.getCaseReference()} ${this.getSentenceDate()}`,
        }
      : { html: `${this.getCourtName()}<br>${this.getCaseReference()} ${this.getSentenceDate()}` }
    return [
      [{ text: 'Case details' }, caseDetailsHTML],
      [{ text: 'Days' }, { text: this.getTaggedBailDays() }],
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

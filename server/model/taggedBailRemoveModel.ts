import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'
import { dateToString } from '../utils/utils'

export default class TaggedBailRemoveModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    public adjustmentType: AdjustmentType,
    public sentenceAndOffense: PrisonApiOffenderSentenceAndOffences,
  ) {}

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}`
  }

  public rows() {
    return [
      [
        { text: 'Case details' },
        { html: `${this.getCourtName()}<br>${this.getCaseReference()} ${this.getSentenceDate()}` },
      ],
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
    if (this.sentenceAndOffense) {
      return this.sentenceAndOffense.courtDescription
    }

    return null
  }

  private getTaggedBailDays(): number {
    if (this.adjustment) {
      return this.adjustment.days || this.adjustment.daysBetween || this.adjustment.effectiveDays
    }

    return null
  }

  private getSentenceDate(): string {
    if (this.sentenceAndOffense) {
      return dateToString(new Date(this.sentenceAndOffense.sentenceDate))
    }

    return null
  }

  private getCaseReference(): string {
    if (this.sentenceAndOffense) {
      return this.sentenceAndOffense.caseReference
    }

    return null
  }
}

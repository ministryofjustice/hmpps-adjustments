import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateToString, getSentenceRecallTagHTML, isSentenceRecalled } from '../utils/utils'
import SessionAdjustment from '../@types/AdjustmentTypes'

export default class TaggedBailEditModel {
  constructor(
    public prisonerNumber: string,
    public adjustment: SessionAdjustment | Adjustment,
    public sentenceAndOffence: PrisonApiOffenderSentenceAndOffences,
    public numberOfCases: number,
    public showUnusedMessage: boolean,
  ) {}

  public summary() {
    return {
      rows: [
        {
          key: {
            text: 'Case details',
          },
          value: {
            html: `${this.getCaseDetailsCell()}`,
          },
          actions: {
            items:
              this.numberOfCases > 1
                ? [
                    {
                      href: `/${this.prisonerNumber}/tagged-bail/select-case/edit/${this.adjustment.id}`,
                      text: 'Edit',
                      visuallyHiddenText: 'case details',
                    },
                  ]
                : [],
          },
        },
        {
          key: {
            text: 'Days',
          },
          value: {
            text: `${this.getTaggedBailDays()}`,
          },
          actions: {
            items: [
              {
                href: `/${this.prisonerNumber}/tagged-bail/days/edit/${this.adjustment.id}`,
                text: 'Edit',
                visuallyHiddenText: 'days',
              },
            ],
          },
        },
      ],
    }
  }

  private getCaseDetailsCell(): string {
    return `${this.getCourtName()} ${isSentenceRecalled(this.sentenceAndOffence.sentenceCalculationType) ? getSentenceRecallTagHTML() : ''}<br>${this.getCaseReference()} ${this.getSentenceDate()}`
  }

  private getCourtName(): string {
    if (this.sentenceAndOffence) {
      return this.sentenceAndOffence.courtDescription
    }

    return null
  }

  private getTaggedBailDays(): number {
    if (this.adjustment) {
      return Number(this.adjustment.days)
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

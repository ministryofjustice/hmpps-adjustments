import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { dateToString } from '../utils/utils'
import SessionAdjustment from '../@types/AdjustmentTypes'
import AdjustmentsFormFactory from './adjustmentFormFactory'

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
            html: `${this.getCourtName()}<br>${this.getCaseReference()} ${this.getSentenceDate()}`,
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

  private getCourtName(): string {
    if (this.sentenceAndOffence) {
      return this.sentenceAndOffence.courtDescription
    }

    return null
  }

  private getTaggedBailDays(): number {
    if (this.adjustment) {
      return Number(AdjustmentsFormFactory.days(this.adjustment))
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

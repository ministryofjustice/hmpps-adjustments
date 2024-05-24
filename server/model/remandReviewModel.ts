import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import {
  daysBetween,
  formatDate,
  getSentenceRecallTagHTML,
  offencesForRemandAdjustment,
  remandRelatedValidationSummary,
} from '../utils/utils'
import ReviewRemandForm from './reviewRemandForm'
import { CalculateReleaseDatesValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class RemandReviewModel {
  adjustmentIds: string[]

  constructor(
    public prisonerNumber: string,
    public adjustments: Record<string, Adjustment>,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private calculateReleaseDatesValidationMessages: CalculateReleaseDatesValidationMessage[],
    public form: ReviewRemandForm,
  ) {
    this.adjustmentIds = Object.keys(adjustments)
  }

  public remandRelatedValidationSummary() {
    return remandRelatedValidationSummary(this.calculateReleaseDatesValidationMessages)
  }

  public totalDays(): number {
    return Object.values(this.adjustments)
      .map(it => daysBetween(new Date(it.fromDate), new Date(it.toDate)))
      .reduce((sum, current) => sum + current, 0)
  }

  public multipleRemandAdjustments(): boolean {
    return Object.values(this.adjustments).length > 1
  }

  remandTotals() {
    return [
      ...Object.values(this.adjustments).map(it => {
        return [
          { text: `From ${dayjs(it.fromDate).format('DD MMM YYYY')} to ${dayjs(it.toDate).format('DD MMM YYYY')}` },
          { text: daysBetween(new Date(it.fromDate), new Date(it.toDate)) },
        ]
      }),
      [{ text: 'Total days', classes: 'govuk-table__header' }, { text: this.totalDays() }],
    ]
  }

  public backlink(): string {
    return `/${this.prisonerNumber}/remand/offences/add/${this.adjustmentIds[0]}`
  }

  public fromDate(id: string) {
    return formatDate(this.adjustments[id].fromDate)
  }

  public toDate(id: string) {
    return formatDate(this.adjustments[id].toDate)
  }

  public adjustmentSummary(id: string) {
    const adjustment = this.adjustments[id]
    const offences = offencesForRemandAdjustment(adjustment, this.sentencesAndOffences)
    const adjustmentFromDate = dayjs(adjustment.fromDate).format('DD MMM YYYY')
    const adjustmentToDate = dayjs(adjustment.toDate).format('DD MMM YYYY')
    return {
      rows: [
        {
          key: {
            text: 'Remand period',
          },
          value: {
            text: `${adjustmentFromDate} to ${adjustmentToDate}`,
          },
          actions: {
            items: [
              {
                href: `/${this.prisonerNumber}/remand/dates/add/${id}`,
                text: 'Edit',
                visuallyHiddenText: `remand period from ${adjustmentFromDate} to ${adjustmentToDate}`,
              },
            ],
          },
        },
        {
          key: {
            text: 'Offences',
          },
          value: {
            html: `<div>
                    ${offences
                      .map(it => {
                        return `<div>${it.offenceDescription}${it.recall ? getSentenceRecallTagHTML() : ''}<br>
                        <span class="govuk-hint">
                          ${this.getCommittedText(it)}
                        </span><br>
                          ${this.getHeardAtCourt(it)}
                        </div>`
                      })
                      .join('')}
                  </div>`,
          },
          actions: {
            items: [
              {
                href: `/${this.prisonerNumber}/remand/offences/add/${id}`,
                text: 'Edit',
                visuallyHiddenText: `offences. ${offences
                  .map(it => {
                    return `${it.offenceDescription} ${this.getCommittedText(it)}${it.recall ? '. This offence was recalled' : ''}`
                  })
                  .join('. ')}`,
              },
            ],
          },
        },
        {
          key: {
            text: 'Days spent on remand',
          },
          value: {
            text: daysBetween(new Date(adjustment.fromDate), new Date(adjustment.toDate)),
          },
        },
      ],
    }
  }

  public getHeardAtCourt(offence: PrisonApiOffence & { recall: boolean; courtDescription: string }): string {
    return `Heard at ${offence.courtDescription}`
  }

  public getCommittedText(offence: PrisonApiOffence & { recall: boolean }): string {
    let committedText
    if (offence.offenceEndDate && offence.offenceStartDate && offence.offenceEndDate !== offence.offenceStartDate) {
      committedText = `Committed from ${dayjs(offence.offenceStartDate).format('DD MMM YYYY')} to ${dayjs(offence.offenceEndDate).format('DD MMM YYYY')}`
    } else if (offence.offenceStartDate) {
      committedText = `Committed on ${dayjs(offence.offenceStartDate).format('DD MMM YYYY')}`
    } else if (offence.offenceEndDate) {
      committedText = `Committed on ${dayjs(offence.offenceEndDate).format('DD MMM YYYY')}`
    } else {
      committedText = 'Offence date not entered'
    }

    return committedText
  }

  public totalDaysSummary() {
    return {
      rows: [
        {
          key: {
            text: 'Total days',
          },
          value: {
            text: this.totalDays(),
          },
        },
      ],
      attributes: { 'data-qa': 'total-days-summary' },
    }
  }
}

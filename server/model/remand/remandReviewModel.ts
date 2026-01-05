import dayjs from 'dayjs'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import {
  daysBetween,
  formatDate,
  getCommittedText,
  getSummaryHtmlForOffences,
  offencesForRemandAdjustment,
  remandRelatedValidationSummary,
} from '../../utils/utils'
import ReviewRemandForm from '../reviewRemandForm'
import { CalculateReleaseDatesValidationMessage } from '../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import RemandAndSentencingService from '../../services/remandAndSentencingService'

export default class RemandReviewModel {
  adjustmentIds: string[]

  constructor(
    public prisonerNumber: string,
    public adjustments: Record<string, Adjustment>,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private calculateReleaseDatesValidationMessages: CalculateReleaseDatesValidationMessage[],
    public form: ReviewRemandForm,
    private remandAndSentencingService: RemandAndSentencingService,
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
          { text: `From ${dayjs(it.fromDate).format('D MMMM YYYY')} to ${dayjs(it.toDate).format('D MMMM YYYY')}` },
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
    const offences = offencesForRemandAdjustment(adjustment, this.sentencesAndOffences, this.remandAndSentencingService)
    const adjustmentFromDate = dayjs(adjustment.fromDate).format('D MMMM YYYY')
    const adjustmentToDate = dayjs(adjustment.toDate).format('D MMMM YYYY')
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
            html: getSummaryHtmlForOffences(offences),
          },
          actions: {
            items: [
              {
                href: `/${this.prisonerNumber}/remand/offences/add/${id}`,
                text: 'Edit',
                visuallyHiddenText: `offences. ${offences
                  .map(it => {
                    return `${it.offenceDescription} ${getCommittedText(it, false)}${it.recall ? '. This offence was recalled' : ''}`
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

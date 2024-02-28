import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween, offencesForAdjustment, remandRelatedValidationSummary } from '../utils/utils'
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

  public adjustmentSummary(id: string) {
    const adjustment = this.adjustments[id]
    const offences = offencesForAdjustment(adjustment, this.sentencesAndOffences)
    return {
      rows: [
        {
          key: {
            text: 'Remand period',
          },
          value: {
            text: `${dayjs(adjustment.fromDate).format('DD MMMM YYYY')} to ${dayjs(adjustment.toDate).format(
              'DD MMMM YYYY',
            )}`,
          },
          actions: {
            items: [
              {
                href: `/${this.prisonerNumber}/remand/dates/add/${id}`,
                text: 'Edit',
                visuallyHiddenText: 'remand',
              },
            ],
          },
        },
        {
          key: {
            text: 'Offences',
          },
          value: {
            html: `<div class="govuk-list">
                    ${offences
                      .map(it => {
                        let committedText
                        if (it.offenceEndDate && it.offenceStartDate && it.offenceEndDate !== it.offenceStartDate) {
                          committedText = `Committed from ${dayjs(it.offenceStartDate).format('DD MMMM YYYY')} to ${dayjs(it.offenceEndDate).format('DD MMMM YYYY')}`
                        } else if (it.offenceStartDate) {
                          committedText = `Committed on ${dayjs(it.offenceStartDate).format('DD MMMM YYYY')}`
                        } else if (it.offenceEndDate) {
                          committedText = `Committed on ${dayjs(it.offenceEndDate).format('DD MMMM YYYY')}`
                        } else {
                          committedText = 'Offence date not entered'
                        }

                        return `<div>${it.offenceDescription}${
                          it.recall ? '<strong class="govuk-tag">Recall</strong>' : ''
                        }<br>
                        <span class="govuk-hint">
                          ${committedText}
                        </span></div>`
                      })
                      .join('')}
                  </div>`,
          },
          actions: {
            items: [
              {
                href: `/${this.prisonerNumber}/remand/offences/add/${id}`,
                text: 'Edit',
                visuallyHiddenText: 'remand',
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

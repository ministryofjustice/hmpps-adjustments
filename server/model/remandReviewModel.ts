import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween, offencesForAdjustment, remandRelatedValidationSummary } from '../utils/utils'
import ReviewRemandForm from './reviewRemandForm'
import { CalculateReleaseDatesValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class RemandReviewModel {
  adjustmentIds: string[]

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: { string?: Adjustment },
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

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}/remand/offences/add/${this.adjustmentIds[0]}`
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
                href: `/${this.prisonerDetail.offenderNo}/remand/dates/add/${id}`,
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
            html: `<ul class="govuk-list govuk-list--bullet">
                    ${offences
                      .map(
                        it =>
                          `<li>${it.offenceDescription}${
                            it.recall ? '<strong class="govuk-tag">Recall</strong>' : ''
                          }</li>`,
                      )
                      .join('')}
                  </ul>`,
          },
          actions: {
            items: [
              {
                href: `/${this.prisonerDetail.offenderNo}/remand/offences/add/${id}`,
                text: 'Edit',
                visuallyHiddenText: 'remand',
              },
            ],
          },
        },
        {
          key: {
            text: 'Days spend on remand',
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

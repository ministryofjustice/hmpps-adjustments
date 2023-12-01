import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween } from '../utils/utils'
import ReviewRemandForm from './reviewRemandForm'
import { CalculateReleaseDatesValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

export default class RemandReviewModel {
  remandRelatedValidationCodes = ['REMAND_OVERLAPS_WITH_REMAND', 'REMAND_OVERLAPS_WITH_SENTENCE']

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

  private remandRelatedValidation() {
    return this.calculateReleaseDatesValidationMessages.filter(it =>
      this.remandRelatedValidationCodes.includes(it.code),
    )
  }

  public remandRelatedValidationSummary() {
    const message = this.remandRelatedValidation().length ? this.remandRelatedValidation()[0] : null
    if (!message) {
      return {
        errorList: [] as string[],
      }
    }
    const overlapsWithRemand = message.code === 'REMAND_OVERLAPS_WITH_REMAND'
    return {
      titleText: overlapsWithRemand
        ? 'Remand time cannot overlap'
        : 'Remand cannot be applied when a sentence is being served.',
      errorList: [
        {
          text: `The remand dates from ${dayjs(message.arguments[2]).format('DD MMM YYYY')} to ${dayjs(
            message.arguments[3],
          ).format('DD MMM YYYY')} overlaps with ${
            overlapsWithRemand ? 'another remand period' : 'a sentence'
          } from ${dayjs(message.arguments[0]).format('DD MMM YYYY')} to ${dayjs(message.arguments[1]).format(
            'DD MMM YYYY',
          )}`,
        },
      ],
    }
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
    const offences = this.sentencesAndOffences.flatMap(it =>
      it.offences.filter(off => adjustment.remand.chargeId.includes(off.offenderChargeId)),
    )
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
                    ${offences.map(it => `<li>${it.offenceDescription}</li>`).join('')}
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
          actions: {
            items: [
              {
                href: `/${this.prisonerDetail.offenderNo}/remand/session/remove/${id}`,
                text: 'Remove',
                visuallyHiddenText: 'remand',
              },
            ],
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
    }
  }
}

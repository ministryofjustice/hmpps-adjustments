import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween } from '../utils/utils'
import ReviewRemandForm from './reviewRemandForm'

export default class RemandReviewModel {
  adjustmentIds: string[]

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: { string?: Adjustment },
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public form: ReviewRemandForm,
  ) {
    this.adjustmentIds = Object.keys(adjustments)
  }

  public totalDays(): number {
    return Object.values(this.adjustments)
      .map(it => daysBetween(new Date(it.fromDate), new Date(it.toDate)))
      .reduce((sum, current) => sum + current, 0)
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
    }
  }
}

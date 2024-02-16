import dayjs from 'dayjs'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import RecallForm from './recallForm'

export default class RecallModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: Adjustment[],
    public form: RecallForm,
  ) {}

  public checkboxes() {
    return {
      name: 'adjustments',
      fieldset: {
        legend: {
          text: 'Do these adjustments apply?',
          classes: 'govuk-fieldset__legend--m',
        },
      },
      items: (
        this.adjustments
          .filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
          .map(it => {
            return {
              value: it.id,
              text: it.adjustmentType === 'REMAND' ? this.remandText(it) : this.taggedBailText(it),
            }
          }) as { value?: string; text?: string; divider?: string; behaviour?: string }[]
      ).concat([
        {
          divider: 'or',
        },
        {
          value: 'none',
          text: 'None of these apply',
          behaviour: 'exclusive',
        },
      ]),
    }
  }

  private remandText(adjustment: Adjustment) {
    return `Remand ${adjustment.daysTotal} days from  ${dayjs(adjustment.fromDate).format(
      'D MMM YYYY',
    )} to ${dayjs(adjustment.toDate).format('D MMM YYYY')}`
  }

  private taggedBailText(adjustment: Adjustment) {
    return `Tagged bail ${adjustment.daysTotal} days`
  }
}

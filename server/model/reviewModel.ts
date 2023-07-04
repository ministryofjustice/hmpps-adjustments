import dayjs from 'dayjs'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'

export default class ReviewModel {
  constructor(public prisonerDetail: PrisonApiPrisoner, public adjustment: Adjustment) {}

  adjustmentType(): AdjustmentType {
    return adjustmentTypes.find(it => it.value === this.adjustment.adjustmentType)
  }

  changeLink(): string {
    return `/${this.adjustment.person}/${this.adjustmentType().url}/edit${
      this.adjustment.id ? `/${this.adjustment.id}` : ''
    }`
  }

  public summaryRows() {
    return ReviewModel.summaryRowsFromAdjustment(this.adjustment).map(it => {
      return {
        ...it,
        actions: {
          items: [
            {
              href: this.changeLink(),
              text: 'Change',
            },
          ],
        },
      }
    })
  }

  public static summaryRowsFromAdjustment(adjustment: Adjustment) {
    if (adjustment.adjustmentType === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return [
        {
          key: {
            text: 'Date of days restored',
          },
          value: {
            text: dayjs(adjustment.fromDate).format('D MMM YYYY'),
          },
        },
        {
          key: {
            text: 'Days',
          },
          value: {
            text: adjustment.days,
          },
        },
      ]
    }
    return [
      {
        key: {
          text: 'From',
        },
        value: {
          text: dayjs(adjustment.fromDate).format('D MMM YYYY'),
        },
      },
      ...(adjustment.days
        ? [
            {
              key: {
                text: 'Days',
              },
              value: {
                text: adjustment.days,
              },
            },
          ]
        : []),
      ...(adjustment.toDate
        ? [
            {
              key: {
                text: 'To',
              },
              value: {
                text: dayjs(adjustment.toDate).format('D MMM YYYY'),
              },
            },
          ]
        : []),
    ]
  }
}

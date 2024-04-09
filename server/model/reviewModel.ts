import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'
import ualType from './ualType'
import { daysBetween } from '../utils/utils'

export default class ReviewModel {
  constructor(public adjustment: Adjustment) {}

  public adjustmentType(): AdjustmentType {
    return ReviewModel.adjustmentTypeFromAdjustment(this.adjustment)
  }

  private static adjustmentTypeFromAdjustment(adjustment: Adjustment) {
    return adjustmentTypes.find(it => it.value === adjustment.adjustmentType)
  }

  public changeLink(): string {
    return `/${this.adjustment.person}/${this.adjustmentType().url}/edit${
      this.adjustment.id ? `/${this.adjustment.id}` : ''
    }`
  }

  public isEdit(): boolean {
    return !!this.adjustment.id
  }

  public cancelLink(): string {
    return this.isEdit() ? `/${this.adjustment.person}/${this.adjustmentType().url}/view` : `/${this.adjustment.person}`
  }

  public summaryRows() {
    return ReviewModel.summaryRowsFromAdjustment(this.adjustment, true)
  }

  public static summaryRowsFromAdjustment(adjustment: Adjustment, includeEdit: boolean) {
    if (adjustment.adjustmentType === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return [
        {
          key: {
            text: 'Date of days restored',
          },
          value: {
            text: dayjs(adjustment.fromDate).format('D MMM YYYY'),
          },
          ...ReviewModel.editActions(adjustment, includeEdit),
        },
        {
          key: {
            text: 'Number of days',
          },
          value: {
            text: adjustment.days,
          },
          ...ReviewModel.editActions(adjustment, includeEdit),
        },
      ]
    }
    if (adjustment.adjustmentType === 'UNLAWFULLY_AT_LARGE') {
      return this.ualRows(adjustment, includeEdit)
    }
    return [
      {
        key: {
          text: 'From',
        },
        value: {
          text: dayjs(adjustment.fromDate).format('D MMM YYYY'),
        },
        ...ReviewModel.editActions(adjustment, includeEdit),
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
              ...ReviewModel.editActions(adjustment, includeEdit),
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
              ...ReviewModel.editActions(adjustment, includeEdit),
            },
          ]
        : []),
    ]
  }

  private static editActions(adjustment: Adjustment, includeEdit: boolean) {
    if (!includeEdit) {
      return {}
    }
    const adjustmentType = ReviewModel.adjustmentTypeFromAdjustment(adjustment)
    return {
      actions: {
        items: [
          {
            href: `/${adjustment.person}/${adjustmentType.url}/edit`,
            text: 'Edit',
            visuallyHiddenText: adjustmentType.text,
          },
        ],
      },
    }
  }

  private static ualRows(adjustment: Adjustment, includeEdit: boolean) {
    const type = ualType.find(it => it.value === adjustment.unlawfullyAtLarge?.type)
    return [
      {
        key: {
          text: 'First day spent UAL',
        },
        value: {
          text: dayjs(adjustment.fromDate).format('D MMM YYYY'),
        },
        ...ReviewModel.editActions(adjustment, includeEdit),
      },
      {
        key: {
          text: 'Last day spent UAL',
        },
        value: {
          text: dayjs(adjustment.toDate).format('D MMM YYYY'),
        },
        ...ReviewModel.editActions(adjustment, includeEdit),
      },
      {
        key: {
          text: 'Number of days',
        },
        value: {
          text: daysBetween(new Date(adjustment.fromDate), new Date(adjustment.toDate)),
        },
        ...ReviewModel.editActions(adjustment, includeEdit),
      },
      {
        key: {
          text: 'Type of UAL',
        },
        value: {
          text: type ? type.text : 'Unknown',
        },
        ...ReviewModel.editActions(adjustment, includeEdit),
      },
    ]
  }
}

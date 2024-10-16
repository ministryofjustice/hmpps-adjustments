import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import adjustmentTypes, { AdjustmentType } from './adjustmentTypes'
import ualType from './ualType'
import { daysBetween, formatDate } from '../utils/utils'
import lalAffectsReleaseDates from './lalAffectsReleaseDates'

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
            text: formatDate(adjustment.fromDate),
          },
          ...ReviewModel.editActions(adjustment, includeEdit, 'date of days restored'),
        },
        {
          key: {
            text: 'Number of days',
          },
          value: {
            text: adjustment.days,
          },
          ...ReviewModel.editActions(adjustment, includeEdit, 'number of days'),
        },
      ]
    }
    if (adjustment.adjustmentType === 'UNLAWFULLY_AT_LARGE') {
      return this.ualRows(adjustment, includeEdit)
    }
    if (adjustment.adjustmentType === 'LAWFULLY_AT_LARGE') {
      return this.lalRows(adjustment, includeEdit)
    }
    return [
      {
        key: {
          text: 'From',
        },
        value: {
          text: formatDate(adjustment.fromDate),
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'from date'),
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
                text: formatDate(adjustment.toDate),
              },
              ...ReviewModel.editActions(adjustment, includeEdit, 'to date'),
            },
          ]
        : []),
    ]
  }

  private static editActions(adjustment: Adjustment, includeEdit: boolean, visuallyHiddenText?: string) {
    if (!includeEdit) {
      return {}
    }

    const adjustmentType = ReviewModel.adjustmentTypeFromAdjustment(adjustment)
    return {
      actions: {
        items: [
          {
            href: `/${adjustment.person}/${adjustmentType.url}/edit/${adjustment.id}`,
            text: 'Edit',
            visuallyHiddenText: visuallyHiddenText || adjustmentType.text,
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
          text: formatDate(adjustment.fromDate),
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'first day spent on UAL'),
      },
      {
        key: {
          text: 'Last day spent UAL',
        },
        value: {
          text: formatDate(adjustment.toDate),
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'last day spent on UAL'),
      },
      {
        key: {
          text: 'Number of days',
        },
        value: {
          text: daysBetween(new Date(adjustment.fromDate), new Date(adjustment.toDate)),
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'number of days'),
      },
      {
        key: {
          text: 'Type of UAL',
        },
        value: {
          text: type ? type.text : 'Unknown',
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'type of UAL'),
      },
    ]
  }

  private static lalRows(adjustment: Adjustment, includeEdit: boolean) {
    const affectsDates = lalAffectsReleaseDates.find(it => it.value === adjustment.lawfullyAtLarge?.affectsDates)
    return [
      {
        key: {
          text: 'First day spent LAL',
        },
        value: {
          text: formatDate(adjustment.fromDate),
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'first day spent on LAL'),
      },
      {
        key: {
          text: 'Last day spent LAL',
        },
        value: {
          text: formatDate(adjustment.toDate),
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'last day spent on LAL'),
      },
      {
        key: {
          text: 'Number of days',
        },
        value: {
          text: daysBetween(new Date(adjustment.fromDate), new Date(adjustment.toDate)),
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'number of days'),
      },
      {
        key: {
          text: 'Delay release dates',
        },
        value: {
          text: affectsDates ? affectsDates.text : 'Unknown',
        },
        ...ReviewModel.editActions(adjustment, includeEdit, 'delay release dates'),
      },
    ]
  }
}

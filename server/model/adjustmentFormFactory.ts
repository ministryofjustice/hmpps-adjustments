import dayjs from 'dayjs'
import { Request } from 'express'
import { Adjustment, AdjustmentTypes } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'
import AdjustmentsForm from './adjustmentsForm'
import RestoredAdditionalDaysForm from './restoredAdditionalDaysForm'
import GenericAdjustmentForm, { GenericAdjustmentFormOptions } from './genericAdjustmentForm'
import UnlawfullyAtLargeForm from './unlawfullyAtLargeForm'

export default class AdjustmentsFormFactory {
  static fromAdjustment<T extends AdjustmentsForm<unknown>>(adjustment: Adjustment): AdjustmentsForm<T> {
    if (adjustment.adjustmentType === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return new RestoredAdditionalDaysForm({
        'from-day': dayjs(adjustment.fromDate).get('date').toString(),
        'from-month': (dayjs(adjustment.fromDate).get('month') + 1).toString(),
        'from-year': dayjs(adjustment.fromDate).get('year').toString(),
        days: adjustment.days.toString(),
      })
    }
    if (adjustment.adjustmentType === 'UNLAWFULLY_AT_LARGE') {
      return new UnlawfullyAtLargeForm({
        'from-day': dayjs(adjustment.fromDate).get('date').toString(),
        'from-month': (dayjs(adjustment.fromDate).get('month') + 1).toString(),
        'from-year': dayjs(adjustment.fromDate).get('year').toString(),
        'to-day': dayjs(adjustment.toDate).get('date').toString(),
        'to-month': (dayjs(adjustment.toDate).get('month') + 1).toString(),
        'to-year': dayjs(adjustment.toDate).get('year').toString(),
        type: adjustment.unlawfullyAtLarge.type,
      })
    }
    return new GenericAdjustmentForm({
      options: this.options(adjustment.adjustmentType),
      'from-day': dayjs(adjustment.fromDate).get('date').toString(),
      'from-month': (dayjs(adjustment.fromDate).get('month') + 1).toString(),
      'from-year': dayjs(adjustment.fromDate).get('year').toString(),
      'to-day': dayjs(adjustment.toDate).get('date').toString(),
      'to-month': (dayjs(adjustment.toDate).get('month') + 1).toString(),
      'to-year': dayjs(adjustment.toDate).get('year').toString(),
      days: adjustment.days.toString(),
      sentence: adjustment.sentenceSequence?.toString(),
    })
  }

  static fromType<T extends AdjustmentsForm<unknown>>(adjustmentType: AdjustmentType): AdjustmentsForm<T> {
    if (adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return new RestoredAdditionalDaysForm({})
    }
    if (adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return new UnlawfullyAtLargeForm({})
    }
    return new GenericAdjustmentForm({
      options: this.options(adjustmentType.value),
    })
  }

  static fromRequest<T extends AdjustmentsForm<unknown>>(
    req: Request,
    adjustmentType: AdjustmentType,
  ): AdjustmentsForm<T> {
    if (adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return new RestoredAdditionalDaysForm(req.body)
    }
    if (adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return new UnlawfullyAtLargeForm(req.body)
    }
    return new GenericAdjustmentForm({ ...req.body, options: this.options(adjustmentType.value) })
  }

  private static options(adjustmentType: AdjustmentTypes): GenericAdjustmentFormOptions {
    return {
      hasSentence: ['REMAND', 'TAGGED_BAIL'].indexOf(adjustmentType) !== -1,
      hasToDate: adjustmentType === 'REMAND',
      adjustmentType,
    }
  }
}

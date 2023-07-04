import dayjs from 'dayjs'
import { Adjustment, AdjustmentTypes } from '../@types/adjustments/adjustmentsTypes'
import { dateItems } from '../utils/utils'

export default class AdjustmentForm {
  constructor(params: Partial<AdjustmentForm>) {
    Object.assign(this, params)
  }

  type: AdjustmentTypes

  'from-day': string

  'from-month': string

  'from-year': string

  'to-day': string

  'to-month': string

  'to-year': string

  sentence: string

  days: string

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'], 'from', [])
  }

  toItems() {
    return dateItems(this['to-year'], this['to-month'], this['to-day'], 'to', [])
  }

  static fromAdjustment(adjustment: Adjustment): AdjustmentForm {
    return new AdjustmentForm({
      type: adjustment.adjustmentType,
      'from-day': dayjs(adjustment.fromDate).get('date').toString(),
      'from-month': (dayjs(adjustment.fromDate).get('month') + 1).toString(),
      'from-year': dayjs(adjustment.fromDate).get('year').toString(),
      'to-day': dayjs(adjustment.toDate).get('date').toString(),
      'to-month': (dayjs(adjustment.toDate).get('month') + 1).toString(),
      'to-year': dayjs(adjustment.toDate).get('year').toString(),
      days: adjustment.days.toString(),
      sentence: adjustment.sentenceSequence.toString(),
    })
  }

  toAdjustment(bookingId: number, nomsId: string): Adjustment {
    return {
      adjustmentType: this.type,
      bookingId,
      fromDate:
        this['from-day'] &&
        dayjs()
          .set('date', Number(this['from-day']))
          .set('month', Number(this['from-month']) - 1)
          .set('year', Number(this['from-year']))
          .format('YYYY-MM-DD'),
      toDate:
        this['to-day'] &&
        dayjs()
          .set('date', Number(this['to-day']))
          .set('month', Number(this['to-month']) - 1)
          .set('year', Number(this['to-year']))
          .format('YYYY-MM-DD'),
      person: nomsId,
      days: this.days ? Number(this.days) : null,
      sentenceSequence: this.sentence ? Number(this.sentence) : null,
    }
  }
}

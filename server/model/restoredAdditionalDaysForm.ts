import dayjs from 'dayjs'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'
import { dateItems } from '../utils/utils'

export default class RestoredAdditionalDaysForm {
  constructor(params: Partial<RestoredAdditionalDaysForm>) {
    Object.assign(this, params)
  }

  'from-day': string

  'from-month': string

  'from-year': string

  days: string

  fromItems() {
    return dateItems(this['from-year'], this['from-month'], this['from-day'])
  }

  static fromAdjustment(adjustment: AdjustmentDetails): RestoredAdditionalDaysForm {
    return new RestoredAdditionalDaysForm({
      'from-day': dayjs(adjustment.fromDate).get('date').toString(),
      'from-month': (dayjs(adjustment.fromDate).get('month') + 1).toString(),
      'from-year': dayjs(adjustment.fromDate).get('year').toString(),
      days: adjustment.days.toString(),
    })
  }

  toAdjustmentDetails(bookingId: number, nomsId: string): AdjustmentDetails {
    return {
      adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
      bookingId,
      fromDate: dayjs()
        .set('date', Number(this['from-day']))
        .set('month', Number(this['from-month']) - 1)
        .set('year', Number(this['from-year']))
        .format('YYYY-MM-DD'),
      toDate: null,
      person: nomsId,
      days: Number(this.days),
      sentenceSequence: null,
    }
  }
}

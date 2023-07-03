import dayjs from 'dayjs'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'

export default class RemoveModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: AdjustmentDetails,
    public adjustmentType: AdjustmentType,
  ) {}

  public summaryRows() {
    if (this.adjustment.adjustmentType === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return [
        {
          key: {
            text: 'Date of days restored',
          },
          value: {
            text: dayjs(this.adjustment.fromDate).format('D MMM YYYY'),
          },
        },
        {
          key: {
            text: 'Days',
          },
          value: {
            text: this.adjustment.days,
          },
        },
      ]
    }
    return [
      {
        key: {
          text: 'from',
        },
        value: {
          text: dayjs(this.adjustment.fromDate).format('D MMM YYYY'),
        },
      },
      {
        key: {
          text: 'Days',
        },
        value: {
          text: this.adjustment.days,
        },
      },
    ]
  }
}

import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import { AdjustmentType } from './adjustmentTypes'

export default abstract class AdjustmentsForm<T> extends AbstractForm<T> {
  abstract toAdjustment(bookingId: number, nomsId: string, idw: string): Adjustment

  abstract adjustmentType(): AdjustmentType

  abstract fragment(): string
}

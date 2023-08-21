import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import { AdjustmentType } from './adjustmentTypes'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default abstract class AdjustmentsForm<T> extends AbstractForm<T> {
  abstract toAdjustment(prisonerDetails: PrisonApiPrisoner, nomsId: string, id: string): Adjustment

  abstract adjustmentType(): AdjustmentType

  abstract fragment(): string
}

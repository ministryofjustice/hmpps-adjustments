import { EditableAdjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import { AdjustmentType } from './adjustmentTypes'
import { Prisoner } from '../@types/prisonSearchApi/types'

export default abstract class AdjustmentsForm<T> extends AbstractForm<T> {
  abstract toAdjustment(prisonerDetails: Prisoner, nomsId: string, id: string): EditableAdjustment

  abstract adjustmentType(): AdjustmentType

  abstract fragment(): string
}

import { EditableAdjustment } from '../@types/adjustments/adjustmentsTypes'
import AbstractForm from './abstractForm'
import { AdjustmentType } from './adjustmentTypes'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'

export default abstract class AdjustmentsForm<T> extends AbstractForm<T> {
  abstract toAdjustment(prisonerDetails: PrisonerSearchApiPrisoner, nomsId: string, id: string): EditableAdjustment

  abstract adjustmentType(): AdjustmentType

  abstract fragment(): string
}

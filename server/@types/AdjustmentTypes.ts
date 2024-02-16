import { EditableAdjustment } from './adjustments/adjustmentsTypes'

type SessionAdjustment = EditableAdjustment & {
  complete?: boolean
}

export default SessionAdjustment

import { Adjustment } from './adjustments/adjustmentsTypes'

type SessionAdjustment = Adjustment & {
  complete?: boolean
}

export default SessionAdjustment

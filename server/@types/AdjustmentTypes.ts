import { Adjustment } from './adjustments/adjustmentsTypes'

type SessionAdjustment = Adjustment & {
  complete?: boolean
  delete?: boolean
}

export default SessionAdjustment

import SessionAdjustment from '../AdjustmentTypes'
import type { UserDetails } from '../../services/userService'
import { Prisoner } from '../prisonSearchApi/types'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    adjustments?: Record<string, Record<string, SessionAdjustment>>
    additionalDayApprovals?: Record<string, Date>
    additionalDayPadas?: Record<string, string[]>
  }
}

export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: Express.User
      prisoner: Prisoner
    }
  }
}

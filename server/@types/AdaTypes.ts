type ChargeDetails = {
  chargeNumber: number
  toBeServed: string
  heardAt: string
  status: ChargeStatus
  days: number
  sequence: number
  consecutiveToSequence: number
}

type ChargeStatus = 'AWARDED_OR_PENDING' | 'SUSPENDED' | 'QUASHED' | 'PROSPECTIVE'
type AdaStatus = 'AWARDED' | 'PENDING APPROVAL' | 'SUSPENDED' | 'QUASHED' | 'PROSPECTIVE'

type AdasByDateCharged = {
  dateChargeProved: Date
  charges: Ada[]
  total: number
  status: AdaStatus
  adjustmentId: string
}

interface Ada extends ChargeDetails {
  dateChargeProved: Date
}

type AdasToReview = {
  awarded: AdasByDateCharged[]
  totalAwarded: number
  suspended: AdasByDateCharged[]
  totalSuspended: number
  quashed: AdasByDateCharged[]
  totalQuashed: number
  awaitingApproval: AdasByDateCharged[]
  totalAwaitingApproval: number
  intercept: AdaIntercept
  totalExistingAdads: number
  showExistingAdaMessage: boolean
}

type AdasToView = {
  awarded: AdasByDateCharged[]
  totalAwarded: number
}

type PadasToReview = {
  prospective: AdasByDateCharged[]
  totalProspective: number
}

type InterceptType = 'NONE' | 'FIRST_TIME' | 'UPDATE' | 'PADA'

type AdaIntercept = {
  type: InterceptType
  number: number
  anyProspective: boolean
}
export {
  ChargeDetails,
  AdasByDateCharged,
  Ada,
  AdasToReview,
  InterceptType,
  AdaIntercept,
  AdaStatus,
  ChargeStatus,
  PadasToReview,
  AdasToView,
}

import { AdasByDateCharged, Adjustment } from './adjustments/adjustmentsTypes'

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
  totalExistingAdas: number
  showExistingAdaMessage: boolean
  adjustmentsToRemove: Adjustment[]
}

type AdasToView = {
  awarded: AdasByDateCharged[]
  totalAwarded: number
  adjustments: Adjustment[]
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
export { AdasByDateCharged, AdasToReview, InterceptType, AdaIntercept, PadasToReview, AdasToView }

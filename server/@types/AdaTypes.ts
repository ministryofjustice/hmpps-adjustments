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
  showRecallMessage: boolean
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

type InterceptType = 'NONE' | 'FIRST_TIME' | 'UPDATE' | 'PADA' | 'PADAS' | 'FIRST_TIME_WITH_NO_ADJUDICATION'

type AdaIntercept = {
  type: InterceptType
  number: number
  anyProspective: boolean
}
export { AdasByDateCharged, AdasToReview, InterceptType, AdaIntercept, PadasToReview, AdasToView }

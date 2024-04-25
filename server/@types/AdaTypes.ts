import { AdasByDateCharged } from './adjustments/adjustmentsTypes'

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
export { AdasByDateCharged, AdasToReview, InterceptType, AdaIntercept, PadasToReview, AdasToView }

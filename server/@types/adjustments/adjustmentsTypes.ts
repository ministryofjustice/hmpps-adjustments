import type {
  AdaAdjudicationDetails as GeneratedAdaAdjudicationDetails,
  AdasByDateCharged as GeneratedAdasByDateCharged,
  AdjustmentDto,
  CreateResponseDto,
  ManualUnusedDeductionsDto,
  PreviousUnlawfullyAtLargeAdjustmentForReview as GeneratedPreviousUnlawfullyAtLargeAdjustmentForReview,
  PreviousUnlawfullyAtLargeReviewRequest as GeneratedPreviousUnlawfullyAtLargeReviewRequest,
  ProspectiveAdaRejectionDto,
  RestoreAdjustmentsDto,
  UnusedDeductionsCalculationResultDto,
  ValidationMessage as GeneratedValidationMessage,
} from './index'

export type AdjustmentTypes = AdjustmentDto['adjustmentType']
export type Adjustment = AdjustmentDto
export type ManualUnusedDeduction = ManualUnusedDeductionsDto
export type CreateResponse = CreateResponseDto
export type ValidationMessage = GeneratedValidationMessage
export type AdjustmentStatus = AdjustmentDto['status']
export type RestoreAdjustments = RestoreAdjustmentsDto
export type AdaAdjudicationDetails = GeneratedAdaAdjudicationDetails
export type AdasByDateCharged = GeneratedAdasByDateCharged
export type ProspectiveAdaRejection = ProspectiveAdaRejectionDto
export type UnusedDeductionsCalculationResult = UnusedDeductionsCalculationResultDto
export type PreviousUnlawfullyAtLargeAdjustmentForReview = GeneratedPreviousUnlawfullyAtLargeAdjustmentForReview
export type PreviousUnlawfullyAtLargeReviewRequest = GeneratedPreviousUnlawfullyAtLargeReviewRequest

import { components } from './index'

export type AdjustmentTypes = components['schemas']['AdjustmentDto']['adjustmentType']
export type Adjustment = components['schemas']['AdjustmentDto']
export type ManualUnusedDeduction = components['schemas']['ManualUnusedDeductionsDto']
export type CreateResponse = components['schemas']['CreateResponseDto']
export type ValidationMessage = components['schemas']['ValidationMessage']
export type AdjustmentStatus = components['schemas']['AdjustmentDto']['status']
export type RestoreAdjustments = components['schemas']['RestoreAdjustmentsDto']
export type AdaAdjudicationDetails = components['schemas']['AdaAdjudicationDetails']
export type AdasByDateCharged = components['schemas']['AdasByDateCharged']
export type ProspectiveAdaRejection = components['schemas']['ProspectiveAdaRejectionDto']
export type UnusedDeductionsCalculationResult = components['schemas']['UnusedDeductionsCalculationResultDto']

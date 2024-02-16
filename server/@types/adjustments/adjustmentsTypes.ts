import { components } from './index'

export type AdjustmentTypes = components['schemas']['AdjustmentDto']['adjustmentType']
export type Adjustment = components['schemas']['AdjustmentDto']
export type EditableAdjustment = components['schemas']['EditableAdjustmentDto']
export type CreateResponse = components['schemas']['CreateResponseDto']
export type ValidationMessage = components['schemas']['ValidationMessage']
export type AdjustmentStatus = components['schemas']['AdjustmentDto']['status']
export type RestoreAdjustments = components['schemas']['RestoreAdjustmentsDto']

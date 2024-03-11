import { AdjustmentTypes } from '../@types/adjustments/adjustmentsTypes'

export type AdjustmentType = {
  value: AdjustmentTypes
  text: string
  alternativeText: string
  shortText: string
  url: string
}

const adjustmentTypes: AdjustmentType[] = [
  {
    value: 'REMAND',
    text: 'Remand',
    shortText: 'remand',
    url: 'remand',
  } as AdjustmentType,
  {
    value: 'TAGGED_BAIL',
    text: 'Tagged bail',
    shortText: 'tagged bail',
    url: 'tagged-bail',
  } as AdjustmentType,
  {
    value: 'UNLAWFULLY_AT_LARGE',
    text: 'UAL (Unlawfully at large)',
    alternativeText: 'UAL',
    shortText: 'UAL',
    url: 'unlawfully-at-large',
  } as AdjustmentType,
  {
    value: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
    text: 'RADA (Restoration of additional days awarded)',
    alternativeText: 'RADA',
    shortText: 'RADA',
    url: 'restored-additional-days',
  } as AdjustmentType,
  {
    value: 'ADDITIONAL_DAYS_AWARDED',
    text: 'ADA (Additional days awarded)',
    shortText: 'ADA',
    url: 'additional-days',
  } as AdjustmentType,
]

export default adjustmentTypes

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
    value: 'LAWFULLY_AT_LARGE',
    text: 'Lawfully at large',
    shortText: 'lawfully at large',
    url: 'lawfully-at-large',
  } as AdjustmentType,
  {
    value: 'UNLAWFULLY_AT_LARGE',
    text: 'Unlawfully at large (UAL)',
    alternativeText: 'UAL',
    shortText: 'UAL',
    url: 'unlawfully-at-large',
  } as AdjustmentType,
  {
    value: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
    text: 'RADA (Restoration of added days)',
    alternativeText: 'RADA',
    shortText: 'RADA',
    moreAboutText:
      "Governors can restore some of the Added days awarded (ADA) time for a prisoner. These are known as RADAs (Restoration of Added Days Awarded). Any RADA's granted will bring forward release dates.",
    url: 'restored-additional-days',
  } as AdjustmentType,
  {
    value: 'ADDITIONAL_DAYS_AWARDED',
    text: 'Additional days awarded (ADA)',
    shortText: 'ADA',
    url: 'additional-days',
  } as AdjustmentType,
  {
    value: 'SPECIAL_REMISSION',
    text: 'Special remission',
    shortText: 'special remission',
    url: 'special-remission',
  } as AdjustmentType,
]

export default adjustmentTypes

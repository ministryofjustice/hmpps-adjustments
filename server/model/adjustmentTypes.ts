export type AdjustmentType = {
  value: string
  text: string
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
    shortText: 'UAL',
    url: 'unlawfully-at-large',
  } as AdjustmentType,
  {
    value: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
    text: 'Restore additional days awarded (RADA)',
    shortText: 'RADA',
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
  {
    value: 'TIME_SPENT_IN_CUSTODY_ABROAD',
    text: 'Time spent in custody abroad',
    shortText: 'time spent in custody',
    url: 'spent-abroad',
  } as AdjustmentType,
]

export default adjustmentTypes

import { AdjustmentTypes } from '../@types/adjustments/adjustmentsTypes'
import config from '../config'

export type AdjustmentType = {
  value: AdjustmentTypes
  text: string
  alternativeText: string
  shortText: string
  url: string
  deduction: boolean
}

let types: AdjustmentType[] = [
  {
    value: 'UNUSED_DEDUCTIONS',
    text: 'Unused deductions',
    shortText: 'unused deductions',
    url: 'unused-deductions',
    deduction: true,
  } as AdjustmentType,
  {
    value: 'REMAND',
    text: 'Remand',
    shortText: 'remand',
    url: 'remand',
    deduction: true,
  } as AdjustmentType,
  {
    value: 'TAGGED_BAIL',
    text: 'Tagged bail',
    shortText: 'tagged bail',
    url: 'tagged-bail',
    deduction: true,
  } as AdjustmentType,
  {
    value: 'UNLAWFULLY_AT_LARGE',
    text: 'UAL (Unlawfully at large)',
    alternativeText: 'UAL',
    shortText: 'UAL',
    url: 'unlawfully-at-large',
    deduction: false,
  } as AdjustmentType,
  {
    value: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
    text: 'RADA (Restoration of additional days awarded)',
    alternativeText: 'RADA',
    shortText: 'RADA',
    url: 'restored-additional-days',
    deduction: true,
  } as AdjustmentType,
  {
    value: 'ADDITIONAL_DAYS_AWARDED',
    text: 'ADA (Additional days awarded)',
    shortText: 'ADA',
    url: 'additional-days',
    deduction: false,
  } as AdjustmentType,
  {
    value: 'LAWFULLY_AT_LARGE',
    text: 'LAL (Lawfully at large)',
    alternativeText: 'LAL',
    shortText: 'LAL',
    url: 'lawfully-at-large',
    deduction: false,
  } as AdjustmentType,
  {
    value: 'SPECIAL_REMISSION',
    text: 'Special remission',
    shortText: 'Special remission',
    url: 'special-remission',
    deduction: true,
  } as AdjustmentType,
]

if (config.featureToggles.timeSpentInCustodyAbroadEnabled) {
  types = [
    ...types,
    {
      value: 'CUSTODY_ABROAD',
      text: 'Time spent in custody abroad',
      shortText: 'Time spent in custody abroad',
      url: 'custody-abroad',
      deduction: true,
    } as AdjustmentType,
  ]
}

if (config.featureToggles.timeSpentAsAnAppealApplicantNotToCountEnabled) {
  types = [
    ...types,
    {
      value: 'APPEAL_APPLICANT',
      text: 'Time spent as an appeal applicant not to count',
      shortText: 'Time spent as an appeal applicant not to count',
      url: 'appeal-applicant',
      deduction: false,
    } as AdjustmentType,
  ]
}

const adjustmentTypes = [...types]
export default adjustmentTypes

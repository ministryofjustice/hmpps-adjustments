import dayjs from 'dayjs'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'
import ualType from './ualType'

export default class ViewModel {
  public adjustments: Adjustment[]

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    allAdjustments: Adjustment[],
    public adjustmentType: AdjustmentType,
  ) {
    this.adjustments = allAdjustments
      .filter(it => it.adjustmentType === adjustmentType.value)
      .sort((a, b) => a.fromDate.localeCompare(b.fromDate))
  }

  public table() {
    return {
      head: this.columnHeadings(),
      rows: this.rows().concat(this.totalRow()),
    }
  }

  public columnHeadings() {
    if (this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return [
        { text: 'Date the days were restored' },
        { text: 'Entered by' },
        { text: 'Number of days restored', format: 'numeric' },
        { text: 'Actions' },
      ]
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return [
        { text: 'First day' },
        { text: 'Last day' },
        { text: 'Entered by' },
        { text: 'Type' },
        { text: 'Number of days', format: 'numeric' },
        { text: 'Actions' },
      ]
    }
    return [
      { text: 'From' },
      ...(this.adjustmentType.value === 'REMAND' ? [{ text: 'To' }] : []),
      { text: 'Days', format: 'numeric' },
      { text: 'Entered by' },
      { text: 'Actions' },
    ]
  }

  public rows() {
    if (this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return this.adjustments.map(it => {
        return [
          { text: dayjs(it.fromDate).format('D MMM YYYY') },
          { text: it.lastUpdatedBy },
          { text: it.days, format: 'numeric' },
          this.actionCell(it),
        ]
      })
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return this.adjustments.map(it => {
        return [
          { text: dayjs(it.fromDate).format('D MMM YYYY') },
          { text: dayjs(it.toDate).format('D MMM YYYY') },
          { text: it.lastUpdatedBy },
          { text: it.unlawfullyAtLarge ? ualType.find(u => u.value === it.unlawfullyAtLarge.type)?.text : 'Unknown' },
          { text: it.days, format: 'numeric' },
          this.actionCell(it),
        ]
      })
    }
    return this.adjustments.map(it => {
      return [
        { text: dayjs(it.fromDate).format('D MMM YYYY') },
        ...(this.adjustmentType.value === 'REMAND' ? [{ text: dayjs(it.toDate).format('D MMM YYYY') }] : []),
        { text: it.days, format: 'numeric' },
        { text: it.lastUpdatedBy },
        this.actionCell(it),
      ]
    })
  }

  public totalRow() {
    const total = this.adjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    if (
      this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED' ||
      this.adjustmentType.value === 'REMAND'
    ) {
      return [
        [{ html: '<b>Total days</b>' }, { text: '' }, { html: `<b>${total}</b>`, format: 'numeric' }, { html: '' }],
      ]
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return [
        [
          { html: '<b>Total days</b>' },
          { text: '' },
          { text: '' },
          { text: '' },
          { html: `<b>${total}</b>`, format: 'numeric' },
          { html: '' },
        ],
      ]
    }

    return [[{ html: '<b>Total days</b>' }, { html: `<b>${total}</b>`, format: 'numeric' }, { text: '' }, { html: '' }]]
  }

  private actionCell(adjustment: Adjustment) {
    return {
      html: `
      <a class="govuk-link" href="/${adjustment.person}/${this.adjustmentType.url}/edit/${adjustment.id}" data-qa="edit-${adjustment.id}">Edit</a><br />
      <a class="govuk-link" href="/${adjustment.person}/${this.adjustmentType.url}/remove/${adjustment.id}" data-qa="remove-${adjustment.id}">Remove</a><br />
    `,
    }
  }
}

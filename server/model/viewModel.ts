import dayjs from 'dayjs'
import { format } from 'date-fns'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'
import ualType from './unlawfully-at-large/ualType'
import { IdentifyRemandDecision } from '../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import { formatDate } from '../utils/utils'
import lalAffectsReleaseDates from './lawfully-at-large/lalAffectsReleaseDates'
import config from '../config'

export default class ViewModel {
  public adjustments: Adjustment[]

  public recallAdjustments: Adjustment[]

  constructor(
    allAdjustments: Adjustment[],
    public adjustmentType: AdjustmentType,
    public remandDecision: IdentifyRemandDecision,
    public roles: string[],
  ) {
    this.adjustments = allAdjustments
      .filter(it => it.adjustmentType === adjustmentType.value)
      // Keep all UAL adjustments except RECALL
      /// not told FE that recallID exists in this model
      .filter(it => it.recallId === null)
      .sort((a, b) => {
        if (a.fromDate == null) return 1
        if (b.fromDate == null) return -1
        return a.fromDate.localeCompare(b.fromDate)
      })

    this.recallAdjustments = allAdjustments
      .filter(it => it.recallId !== null && it.adjustmentType === adjustmentType.value)
      .map(it => ({
        ...it,
        fromDate: dayjs(it.fromDate).subtract(1, 'day').format('YYYY-MM-DD'), // Set fromDate as revocationDate
        toDate: dayjs(it.toDate).add(1, 'day').format('YYYY-MM-DD'), // Set toDate as arrestDate
      })) // recallual exists in adjustments without it being associated to a recall, lso can edit in adjustments instead of going to recall
      // filter it on whether adjustment has a recallid.  if yes, go to recalls and edit there, if no recalls id it can be edited in adjustments.
      // instead dont filter on type and ual type, its whether it has a recall id or not.
      .sort((a, b) => {
        if (a.fromDate == null) return 1
        if (b.fromDate == null) return -1
        return a.fromDate.localeCompare(b.fromDate)
      })
  }

  public table() {
    return {
      head: this.columnHeadings(),
      rows: this.rows(),
      attributes: { 'data-qa': 'view-table' },
    }
  }

  public secondTable() {
    return {
      head: this.recallColumnHeadings(),
      rows: this.recallRows(),
      attributes: { 'data-qa': 'recall-table' },
    }
  }

  public totalUnlawfullyAtLargeDays(): number {
    const adjustmentDays = this.adjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    const recallAdjustmentDays = this.recallAdjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    return recallAdjustmentDays + adjustmentDays
  }

  public TotalRow() {
    const total = this.totalUnlawfullyAtLargeDays()
    const isPlural = total !== 1 ? 'days' : 'day'
    return `Total days unlawfully at large: ${total} ${isPlural}`
  }

  public allTables() {
    return {
      tables: [this.table(), this.secondTable()],
      total: this.TotalRow(),
    }
  }

  public columnHeadings() {
    if (this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return [
        { text: 'Date of days restored' },
        { text: 'Entered by' },
        { text: 'Number of days', format: 'numeric' },
        { text: 'Actions' },
      ]
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return [
        { text: 'First day' },
        { text: 'Last day' },
        { text: 'Entered by' },
        { text: 'Type', classes: 'table-ual-column-type' },
        { text: 'Number of days', format: 'numeric' },
        { text: 'Actions' },
      ]
    }
    if (this.adjustmentType.value === 'LAWFULLY_AT_LARGE') {
      return [
        { text: 'First day' },
        { text: 'Last day' },
        { text: 'Entered by' },
        { text: 'Delay release dates' },
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

  public recallColumnHeadings() {
    return [
      { html: '<span class="nowrap-header">Date of Revocation</span>' },
      { text: 'Arrest date' },
      { text: 'Entered by' },
      { text: 'Type', classes: 'table-ual-column-type' },
      { text: 'Number of days', format: 'numeric' },
      { text: 'Actions' },
    ]
  }

  public recallRows() {
    return this.recallAdjustments.map(it => {
      return [
        { text: it.fromDate ? format(new Date(it.fromDate), 'dd/MM/yyyy') : '' },
        { text: it.toDate ? format(new Date(it.toDate), 'dd/MM/yyyy') : '' },
        { text: it.prisonName || 'Unknown' },
        { text: 'RECALL', classes: 'table-ual-column-type' },
        { text: it.days, format: 'numeric' },
        this.recallActionCell(it),
      ]
    })
  }

  public rows() {
    if (this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return this.adjustments.map(it => {
        return [
          { text: it.fromDate ? format(new Date(it.fromDate), 'dd/MM/yyyy') : '' },
          { text: it.prisonName || 'Unknown' },
          { text: it.days, format: 'numeric' },
          this.actionCell(it),
        ]
      })
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return this.adjustments.map(it => {
        return [
          { text: it.fromDate ? format(new Date(it.fromDate), 'dd/MM/yyyy') : '' },
          { text: it.toDate ? format(new Date(it.toDate), 'dd/MM/yyyy') : '' },
          { text: it.prisonName || 'Unknown' },
          {
            text: it.unlawfullyAtLarge ? ualType.find(u => u.value === it.unlawfullyAtLarge.type)?.text : 'Unknown',
            classes: 'table-ual-column-type',
          },
          { text: it.days, format: 'numeric' },
          this.actionCell(it),
        ]
      })
    }
    if (this.adjustmentType.value === 'LAWFULLY_AT_LARGE') {
      return this.adjustments.map(it => {
        return [
          { text: it.fromDate ? format(new Date(it.fromDate), 'dd/MM/yyyy') : '' },
          { text: it.toDate ? format(new Date(it.toDate), 'dd/MM/yyyy') : '' },
          { text: it.prisonName || 'Unknown' },
          {
            text: it.lawfullyAtLarge
              ? lalAffectsReleaseDates.find(u => u.value === it.lawfullyAtLarge.affectsDates)?.text
              : 'Unknown',
          },
          { text: it.days, format: 'numeric' },
          this.actionCell(it),
        ]
      })
    }
    return this.adjustments.map(it => {
      return [
        { text: it.fromDate ? format(new Date(it.fromDate), 'dd/MM/yyyy') : '' },
        ...(this.adjustmentType.value === 'REMAND'
          ? [{ text: it.toDate ? format(new Date(it.toDate), 'dd/MM/yyyy') : '' }]
          : []),
        { text: it.days, format: 'numeric' },
        { text: it.prisonName || 'Unknown' },
        this.actionCell(it),
      ]
    })
  }

  public totalRecallRow() {
    const total = this.recallAdjustments.map(it => it.days).reduce((a, b) => a + b, 0)
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
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE' || this.adjustmentType.value === 'LAWFULLY_AT_LARGE') {
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
      <div class="govuk-grid-column-one-quarter govuk-!-margin-right-4 govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/${this.adjustmentType.url}/edit/${adjustment.id}" data-qa="edit-${adjustment.id}">
          Edit<span class="govuk-visually-hidden"> ${this.getVisuallyHiddenTagContent(adjustment)}</span>
        </a>
      </div>
      <div class="govuk-grid-column-one-quarter govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/${this.adjustmentType.url}/remove/${adjustment.id}" data-qa="remove-${adjustment.id}">
          Delete<span class="govuk-visually-hidden"> ${this.getVisuallyHiddenTagContent(adjustment)}</span>
        </a>
      </div>
    `,
    }
  }

  private recallActionCell(adjustment: Adjustment) {
    return {
      html: `
        <a class="govuk-link govuk-!-white-space-nowrap" href="${config.services.recallsUI.url}/person/${adjustment.person}/edit-recall/${adjustment.recallId}" data-qa="edit-recall-${adjustment.id}">
          Edit recall<span class="govuk-visually-hidden"> ${this.getVisuallyHiddenTagContent(adjustment)}</span>
        </a>
      `,
      attributes: { class: 'govuk-table__cell' },
    }
  }

  private getVisuallyHiddenTagContent(adjustment: Adjustment): string {
    if (this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return `${adjustment.days} ${adjustment.days > 1 ? 'days' : 'day'} restored on ${formatDate(adjustment.fromDate)}`
    }

    return adjustment.toDate
      ? `${this.adjustmentType.shortText} from ${formatDate(adjustment.fromDate)} to ${formatDate(adjustment.toDate)}`
      : `${this.adjustmentType.shortText} on ${formatDate(adjustment.fromDate)}`
  }
}

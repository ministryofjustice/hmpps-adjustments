import dayjs from 'dayjs'
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
      .sort((a, b) => {
        if (a.fromDate == null) return 1
        if (b.fromDate == null) return -1
        return a.fromDate.localeCompare(b.fromDate)
      })

    if (roles.includes('RECALL_MAINTAINER')) {
      this.adjustments = this.adjustments.filter(it => !it.recallId)

      this.recallAdjustments = allAdjustments
        .filter(it => it.recallId && it.adjustmentType === adjustmentType.value)
        .map(it => ({
          ...it,
          fromDate: dayjs(it.fromDate).subtract(1, 'day').format('D MMMM YYYY'),
          toDate: dayjs(it.toDate).add(1, 'day').format('D MMMM YYYY'),
        }))

        .sort((a, b) => {
          if (a.fromDate == null) return 1
          if (b.fromDate == null) return -1
          return a.fromDate.localeCompare(b.fromDate)
        })
    }
  }

  public table() {
    return {
      head: this.columnHeadings(),
      rows: this.rows().concat(this.totalRow()),
      attributes: { 'data-qa': 'view-table' },
    }
  }

  public secondTable() {
    return {
      head: this.recallColumnHeadings(),
      rows: this.recallRows().concat(this.totalRecallRow()),
      attributes: { 'data-qa': 'recall-table' },
    }
  }

  public totalDays(): number {
    const adjustmentDays = this.adjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    const recallAdjustmentDays = this.recallAdjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    return recallAdjustmentDays + adjustmentDays
  }

  public TotalRow() {
    const total = this.totalDays()
    const isPlural = total !== 1 ? 'days' : 'day'
    return `Total days: ${total} ${isPlural}`
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
        { text: 'Number of days' },
        { text: 'Actions' },
      ]
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return [
        { text: 'First day' },
        { text: 'Last day' },
        { text: 'Entered by' },
        { text: 'Type', classes: 'table-ual-column-type' },
        { text: 'Number of days' },
        { text: 'Actions' },
      ]
    }
    if (this.adjustmentType.value === 'LAWFULLY_AT_LARGE') {
      return [
        { text: 'First day' },
        { text: 'Last day' },
        { text: 'Entered by' },
        { text: 'Delay release dates' },
        { text: 'Number of days' },
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
      { html: '<span class="nowrap-header">Date of revocation</span>' },
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
        { html: dayjs(it.fromDate).format('D MMMM YYYY') },
        { text: dayjs(it.toDate).format('D MMMM YYYY') },
        { text: it.prisonName || 'Unknown' },
        { text: 'Recall', classes: 'table-ual-column-type' },
        { text: it.days },
        this.recallActionCell(it),
      ]
    })
  }

  public rows() {
    if (this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      return this.adjustments.map(it => {
        return [
          { html: dayjs(it.fromDate).format('D MMMM YYYY') },
          { text: it.prisonName || 'Unknown' },
          { text: it.days },
          this.actionCell(it),
        ]
      })
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE') {
      return this.adjustments.map(it => {
        return [
          { html: dayjs(it.fromDate).format('D MMMM YYYY') },
          { text: dayjs(it.toDate).format('D MMMM YYYY') },
          { text: it.prisonName || 'Unknown' },
          {
            text: it.unlawfullyAtLarge ? ualType.find(u => u.value === it.unlawfullyAtLarge.type)?.text : 'Unknown',
            classes: 'table-ual-column-type',
          },
          { text: it.days },
          this.actionCell(it),
        ]
      })
    }
    if (this.adjustmentType.value === 'LAWFULLY_AT_LARGE') {
      return this.adjustments.map(it => {
        return [
          { html: dayjs(it.fromDate).format('D MMMM YYYY') },
          { text: dayjs(it.toDate).format('D MMMM YYYY') },
          { text: it.prisonName || 'Unknown' },
          {
            text: it.lawfullyAtLarge
              ? lalAffectsReleaseDates.find(u => u.value === it.lawfullyAtLarge.affectsDates)?.text
              : 'Unknown',
          },
          { text: it.days },
          this.actionCell(it),
        ]
      })
    }
    return this.adjustments.map(it => {
      return [
        { html: dayjs(it.fromDate).format('D MMMM YYYY') },
        ...(this.adjustmentType.value === 'REMAND' ? [{ text: dayjs(it.toDate).format('D MMMM YYYY') }] : []),
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
        { html: `<b>${total}</b>`, colspan: 2 },
      ],
    ]
  }

  public totalRow() {
    const total = this.adjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    if (
      this.adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED' ||
      this.adjustmentType.value === 'REMAND'
    ) {
      return [[{ html: '<b>Total days</b>' }, { text: '' }, { html: `<b>${total}</b>`, colspan: 2 }]]
    }
    if (this.adjustmentType.value === 'UNLAWFULLY_AT_LARGE' || this.adjustmentType.value === 'LAWFULLY_AT_LARGE') {
      return [
        [
          { html: '<b>Total days</b>' },
          { text: '' },
          { text: '' },
          { text: '' },
          { html: `<b>${total}</b>`, colspan: 2 },
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
        <a class="govuk-link govuk-!-white-space-nowrap" href="${config.services.recallsUI.url}/person/${adjustment.person}/edit-recall/${adjustment.recallId}?entrypoint=adj_${this.adjustmentType.url}" data-qa="edit-recall-${adjustment.id}">
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

import dayjs from 'dayjs'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'

export default class ViewModel {
  public adjustments: Adjustment[]

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    allAdjustments: Adjustment[],
    public adjustmentType: AdjustmentType,
  ) {
    this.adjustments = allAdjustments.filter(it => it.adjustmentType === adjustmentType.value)
  }

  public table() {
    return {
      head: this.columnHeadings(),
      rows: this.rows(),
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

  private actionCell(adjustment: Adjustment) {
    return {
      html: `
      <a class="govuk-link" href="/${adjustment.person}/${this.adjustmentType.url}/edit/${adjustment.id}">Edit</a><br />
      <a class="govuk-link" href="/${adjustment.person}/${this.adjustmentType.url}/remove/${adjustment.id}">Remove</a><br />
    `,
    }
  }
}

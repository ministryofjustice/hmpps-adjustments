import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

export default class UnusedDeductionsReviewModel {
  constructor(
    public prisonerNumber: string,
    public addOrEdit: string,
    public unusedDeductionDays: number,
    public remandAndTaggedBailAdjustments: Adjustment[],
    public error?: {
      text: string
      html: string
      href: string
    }[],
    public reviewDeductions?: boolean,
  ) {}

  backlink(): string {
    if (this.reviewDeductions) {
      return `/${this.prisonerNumber}/unused-deductions/review-deductions`
    }

    return `/${this.prisonerNumber}/unused-deductions/days/${this.addOrEdit}`
  }

  public descriptionTextContext(): string {
    if (this.hasRemand() && this.hasTaggedBail()) {
      return 'remand and tagged bail'
    }

    if (this.hasRemand()) {
      return 'remand'
    }

    if (this.hasTaggedBail()) {
      return 'tagged bail'
    }

    return ''
  }

  public hasRemand(): boolean {
    return this.remandAndTaggedBailAdjustments.filter(it => it.adjustmentType === 'REMAND').length > 0
  }

  public hasTaggedBail(): boolean {
    return this.remandAndTaggedBailAdjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL').length > 0
  }

  getRows() {
    const headerRow = this.getHeaderRow()
    const remandRow = this.getRemandRow()
    const taggedBailRow = this.getTaggedBailRow()
    const footerRow = this.getFooterRow()

    const rows = [headerRow]
    if (remandRow) {
      rows.push(remandRow)
    }

    if (taggedBailRow) {
      rows.push(taggedBailRow)
    }

    rows.push(footerRow)

    return { rows }
  }

  getTotalDays(): number {
    const remandDays = this.getAdjustmentDays('REMAND')
    const taggedBailDays = this.getAdjustmentDays('TAGGED_BAIL')
    return remandDays + taggedBailDays
  }

  private getHeaderRow() {
    return {
      key: {
        text: 'Deductions',
      },
      value: {
        html: '<strong>Days</strong>',
        classes: 'govuk-!-text-align-right',
      },
    }
  }

  private getRemandRow() {
    const remandDays = this.getAdjustmentDays('REMAND')
    if (remandDays > 0) {
      return {
        key: {
          text: 'Remand',
        },
        value: {
          html: `${remandDays} <span class="govuk-hint">including ${this.unusedDeductionDays > remandDays ? remandDays : this.unusedDeductionDays} days unused</span>`,
          classes: 'govuk-!-text-align-right',
        },
      }
    }

    return null
  }

  private getTaggedBailRow() {
    const taggedBailDays = this.getAdjustmentDays('TAGGED_BAIL')
    if (taggedBailDays > 0) {
      const remandDays = this.getAdjustmentDays('REMAND')
      return {
        key: {
          text: 'Tagged bail',
        },
        value: {
          html:
            this.unusedDeductionDays > remandDays
              ? `${taggedBailDays} <span class="govuk-hint">including ${this.unusedDeductionDays - remandDays} days unused</span>`
              : this.getAdjustmentDays('TAGGED_BAIL').toString(),
          classes: 'govuk-!-text-align-right',
        },
      }
    }

    return null
  }

  private getFooterRow() {
    return {
      key: {
        text: 'Total',
      },
      value: {
        html: `${this.getTotalDays()} <span class="govuk-hint">including ${this.unusedDeductionDays} days unused</span>`,
        classes: 'govuk-!-text-align-right',
      },
    }
  }

  private getAdjustmentDays(adjustmentType: string): number {
    const adjustments = this.remandAndTaggedBailAdjustments.filter(it => it.adjustmentType === adjustmentType)
    return adjustments.length > 0
      ? adjustments
          .map(it => it.days)
          .reduce((acc, cur) => {
            return acc + cur
          }, 0) || 0
      : 0
  }
}

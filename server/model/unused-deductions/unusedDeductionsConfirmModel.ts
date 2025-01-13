import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'

export default class UnusedDeductionsConfirmModel {
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

  public backlink(): string {
    if (this.reviewDeductions) {
      return `/${this.prisonerNumber}/review-deductions`
    }

    return `/${this.prisonerNumber}/manual-unused-deductions/days/${this.addOrEdit}`
  }

  public showUnusedDeductionsBanner(): boolean {
    return this.reviewDeductions
  }

  public bannerText(): string {
    if (this.unusedDeductionDays === 0) {
      return 'There are no unused deductions'
    }
    return `When you save this ${this.descriptionTextContext()}. The unused deductions will automatically be recorded. Check that the unused remand alert has been added.`
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
      const unusedRemandDays = Math.min(this.unusedDeductionDays, remandDays)
      return {
        key: {
          text: 'Remand',
        },
        value: {
          html: this.includingHint(remandDays, unusedRemandDays),
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
      const unusedTaggedBailDays = this.unusedDeductionDays - remandDays
      return {
        key: {
          text: 'Tagged bail',
        },
        value: {
          html: this.includingHint(taggedBailDays, unusedTaggedBailDays),
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
        html: `<strong>${this.includingHint(this.getTotalDays(), this.unusedDeductionDays, { bold: true })}</strong>`,
        classes: 'govuk-!-text-align-right',
      },
    }
  }

  private includingHint(total: number, unused: number, options?: { bold: boolean }): string {
    let html = `${total}`
    if (unused > 0) {
      const boldStyle = options?.bold ? ' govuk-!-font-weight-bold' : ''
      html += ` <span class="govuk-hint${boldStyle}">including ${unused} days unused</span>`
    }
    return html
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

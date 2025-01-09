import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'

export default class TimeSpentAsAnAppealApplicantRemoveModel {
  constructor(
    public nomsId: string,
    public adjustment: Adjustment,
  ) {}

  public backLink(): string {
    return `/${this.nomsId}/appeal-applicant/view`
  }

  public rows() {
    return [
      [
        { text: 'Entered by' },
        {
          text: `${this.adjustment.prisonName}`,
        },
      ],
      [{ text: 'Number of days' }, { text: this.adjustment.days }],
      [
        { text: 'Court of Appeal reference number' },
        { text: this.adjustment.timeSpentAsAnAppealApplicantNotToCount?.courtOfAppealReferenceNumber || 'Unknown' },
      ],
    ]
  }

  public table() {
    return {
      rows: this.rows(),
      attributes: { 'data-qa': 'view-table' },
      firstCellIsHeader: true,
    }
  }
}

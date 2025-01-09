import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { getSummaryHtmlForOffences, offencesForTimeSpentInCustodyAbroadAdjustment } from '../../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'

export default class TimeSpentAsAnAppealApplicantRemoveModel {
  constructor(
    public nomsId: string,
    public adjustment: Adjustment,
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public backLink(): string {
    return `/${this.nomsId}/appeal-applicant/view`
  }

  public rows() {
    const offences = offencesForTimeSpentInCustodyAbroadAdjustment(this.adjustment, this.sentencesAndOffences)
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
        { text: this.adjustment.timeSpentAsAnAppealApplicant?.courtOfAppealReferenceNumber || 'Unknown' },
      ],
      [{ text: 'Offences' }, { html: getSummaryHtmlForOffences(offences) }],
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

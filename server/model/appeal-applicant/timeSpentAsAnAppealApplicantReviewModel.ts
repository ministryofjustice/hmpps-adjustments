import SessionAdjustment from '../../@types/AdjustmentTypes'
import {
  getCommittedText,
  getSummaryHtmlForOffences,
  offencesForTimeSpentAsAnAppealApplicantAdjustment,
} from '../../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'

export default class TimeSpentAsAnAppealApplicantReviewModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/appeal-applicant/offences/${this.addOrEdit}/${this.id}`
  }

  public cancelLink(): string {
    return this.addOrEdit === 'add' ? `/${this.nomsId}/` : `/${this.nomsId}/appeal-applicant/view`
  }

  public offenceSummary() {
    const offences = offencesForTimeSpentAsAnAppealApplicantAdjustment(this.adjustment, this.sentencesAndOffences)
    return {
      key: {
        text: 'Offences',
      },
      value: {
        html: getSummaryHtmlForOffences(offences),
      },
      actions: {
        items: [
          {
            href: `/${this.nomsId}/appeal-applicant/offences/${this.addOrEdit}/${this.id}`,
            text: 'Edit',
            visuallyHiddenText: `offences. ${offences
              .map(it => {
                return `${it.offenceDescription} ${getCommittedText(it, false)}`
              })
              .join('. ')}`,
          },
        ],
      },
    }
  }
}

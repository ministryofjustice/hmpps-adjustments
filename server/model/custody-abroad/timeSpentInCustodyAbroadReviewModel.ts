import SessionAdjustment from '../../@types/AdjustmentTypes'
import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'
import {
  offencesForTimeSpentInCustodyAbroadAdjustment,
  getCommittedText,
  getSummaryHtmlForOffences,
} from '../../utils/utils'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'

export default class TimeSpentInCustodyAbroadReviewModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/custody-abroad/offences/${this.addOrEdit}/${this.id}`
  }

  public timeSpentInCustodyAbroadDocumentationSource(): string {
    return timeSpentInCustodyAbroadDocumentationSource.find(
      it => it.value === this.adjustment.timeSpentInCustodyAbroad?.documentationSource,
    ).text
  }

  public cancelLink(): string {
    return `/${this.nomsId}/`
  }

  public offenceSummary() {
    const offences = offencesForTimeSpentInCustodyAbroadAdjustment(this.adjustment, this.sentencesAndOffences)
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
            href: `/${this.nomsId}/custody-abroad/offences/${this.addOrEdit}/${this.id}`,
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

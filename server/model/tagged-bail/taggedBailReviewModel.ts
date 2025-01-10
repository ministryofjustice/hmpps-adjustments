import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import SessionAdjustment from '../../@types/AdjustmentTypes'
import {
  dateToString,
  getMostRecentSentenceAndOffence,
  getSentenceRecallTagHTML,
  isSentenceRecalled,
} from '../../utils/utils'

export default class TaggedBailReviewModel {
  constructor(
    public prisonerNumber: string,
    private addOrEdit: string,
    public id: string,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public adjustment: SessionAdjustment,
    public showUnusedMessage: boolean,
  ) {}

  public backlink(): string {
    return `/${this.prisonerNumber}/tagged-bail/days/${this.addOrEdit}/${this.id}`
  }

  public getCaseDetails() {
    const selectedCase = getMostRecentSentenceAndOffence(
      this.sentencesAndOffences.filter(
        it => it.sentenceStatus === 'A' && it.caseSequence === this.adjustment.taggedBail.caseSequence,
      ),
    )

    return `${selectedCase.courtDescription} <span class="vertical-bar"></span> ${selectedCase.caseReference || ''} ${isSentenceRecalled(selectedCase.sentenceCalculationType) ? getSentenceRecallTagHTML() : ''}<br>${dateToString(new Date(selectedCase.sentenceDate))}`
  }
}

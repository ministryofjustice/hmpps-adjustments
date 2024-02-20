import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { dateToString, getMostRecentSentenceAndOffence } from '../utils/utils'

export default class TaggedBailReviewModel {
  constructor(
    private addOrEdit: string,
    public id: string,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public adjustment: SessionAdjustment,
    public prisonerNumber: string,
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

    return `${selectedCase.courtDescription}<br>${selectedCase.caseReference || ''} ${dateToString(
      new Date(selectedCase.sentenceDate),
    )}`
  }
}

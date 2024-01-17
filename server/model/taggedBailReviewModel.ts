import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { dateToString } from '../utils/utils'

export default class TaggedBailReviewModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    private addOrEdit: string,
    private id: string,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}/tagged-bail/days/${this.addOrEdit}/${this.id}`
  }

  public getCaseDetails() {
    const selectedCase = this.sentencesAndOffences
      .filter(it => it.sentenceStatus === 'A' && it.caseSequence == this.adjustment.taggedBail.caseSequence)
      .sort((a, b) => new Date(a.sentenceDate).getTime() - new Date(b.sentenceDate).getTime())[0]

    return `${selectedCase.courtDescription}<br>${selectedCase.caseReference || ''} ${dateToString(
      new Date(selectedCase.sentenceDate),
    )}`
  }
}

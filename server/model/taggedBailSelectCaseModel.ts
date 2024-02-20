import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { getActiveSentencesByCaseSequence, SentencesByCaseSequence } from '../utils/utils'

type SentenceWithCaseDetails = PrisonApiOffenderSentenceAndOffences & { selected: boolean; selectCaseHref: string }

export default class TaggedBailSelectCaseModel {
  private sentencesByCaseSequence: SentencesByCaseSequence[]

  constructor(
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private addOrEdit: string,
    private id: string,
    public adjustment: SessionAdjustment,
    public prisonerNumber: string,
  ) {
    this.sentencesByCaseSequence = getActiveSentencesByCaseSequence(this.sentencesAndOffences)
  }

  public backlink(): string {
    if (this.adjustment.complete) {
      return `/${this.prisonerNumber}/tagged-bail/review/${this.addOrEdit}/${this.id}`
    }
    return `/${this.prisonerNumber}`
  }

  // returns the sentence data for each unique case sequence; i.e. the record that has the earliest sentence date when multiple ones exist
  public activeSentences(): SentenceWithCaseDetails[] {
    return this.sentencesByCaseSequence.map(it => {
      return {
        ...it.sentences.sort((a, b) => new Date(a.sentenceDate).getTime() - new Date(b.sentenceDate).getTime())[0],
        selected: this.adjustment.taggedBail?.caseSequence === it.caseSequence,
        selectCaseHref: this.adjustment.complete
          ? `/${this.prisonerNumber}/tagged-bail/review/${this.addOrEdit}/${this.id}?caseSequence=${it.caseSequence}`
          : `/${this.prisonerNumber}/tagged-bail/days/${this.addOrEdit}/${this.id}?caseSequence=${it.caseSequence}`,
      }
    })
  }
}

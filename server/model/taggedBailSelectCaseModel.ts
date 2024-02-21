import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { getActiveSentencesByCaseSequence, SentencesByCaseSequence } from '../utils/utils'

type SentenceWithCaseDetails = PrisonApiOffenderSentenceAndOffences & { selected: boolean; selectCaseHref: string }

export default class TaggedBailSelectCaseModel {
  private sentencesByCaseSequence: SentencesByCaseSequence[]

  constructor(
    public prisonerNumber: string,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private addOrEdit: string,
    private id: string,
    public adjustment: SessionAdjustment,
  ) {
    this.sentencesByCaseSequence = getActiveSentencesByCaseSequence(this.sentencesAndOffences)
  }

  public backlink(): string {
    if (this.addOrEdit === 'edit') {
      return `/${this.prisonerNumber}/tagged-bail/${this.addOrEdit}/${this.id}`
    }
    if (this.adjustment.complete) {
      return `/${this.prisonerNumber}/tagged-bail/review/${this.addOrEdit}/${this.id}`
    }
    return `/${this.prisonerNumber}`
  }

  // returns the sentence data for each unique case sequence; i.e. the record that has the earliest sentence date when multiple ones exist
  public activeSentences(): SentenceWithCaseDetails[] {
    return this.sentencesByCaseSequence.map(it => {
      let selectCaseHref
      if (this.addOrEdit === 'edit') {
        selectCaseHref = `/${this.prisonerNumber}/tagged-bail/${this.addOrEdit}/${this.id}?caseSequence=${it.caseSequence}`
      } else if (this.adjustment.complete) {
        selectCaseHref = `/${this.prisonerNumber}/tagged-bail/review/${this.addOrEdit}/${this.id}?caseSequence=${it.caseSequence}`
      } else {
        selectCaseHref = `/${this.prisonerNumber}/tagged-bail/days/${this.addOrEdit}/${this.id}?caseSequence=${it.caseSequence}`
      }
      return {
        ...it.sentences.sort((a, b) => new Date(a.sentenceDate).getTime() - new Date(b.sentenceDate).getTime())[0],
        selected: this.adjustment.taggedBail?.caseSequence === it.caseSequence,
        selectCaseHref,
      }
    })
  }
}

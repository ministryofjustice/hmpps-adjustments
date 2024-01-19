import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import SessionAdjustment from '../@types/AdjustmentTypes'

type SentencesByCaseSequence = {
  caseSequence: number
  sentences: PrisonApiOffenderSentenceAndOffences[]
}

type SentenceWithCaseDetails = PrisonApiOffenderSentenceAndOffences & { selected: boolean; selectCaseHref: string }

export default class TaggedBailSelectCaseModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private addOrEdit: string,
    private id: string,
    public adjustment: SessionAdjustment,
  ) {}

  public backlink(): string {
    if (this.adjustment.complete) {
      return `/${this.prisonerDetail.offenderNo}/tagged-bail/review/${this.addOrEdit}/${this.id}`
    }
    return `/${this.prisonerDetail.offenderNo}`
  }

  // returns the sentence data for each unique case sequence; i.e. the record that has the earliest sentence date when multiple ones exist
  public activeSentences(): SentenceWithCaseDetails[] {
    const sentencesBySequenceNumber = this.getSentencesByCaseSequence()
    return sentencesBySequenceNumber.map(it => {
      return {
        ...it.sentences.sort((a, b) => new Date(a.sentenceDate).getTime() - new Date(b.sentenceDate).getTime())[0],
        selected: this.adjustment.taggedBail?.caseSequence === it.caseSequence,
        selectCaseHref: this.adjustment.complete
          ? `/${this.prisonerDetail.offenderNo}/tagged-bail/review/${this.addOrEdit}/${this.id}`
          : `/${this.prisonerDetail.offenderNo}/tagged-bail/days/${this.addOrEdit}/${this.id}?caseSequence=${it.caseSequence}`,
      }
    })
  }

  private getSentencesByCaseSequence(): SentencesByCaseSequence[] {
    return this.sentencesAndOffences
      .filter(it => it.sentenceStatus === 'A')
      .reduce((acc: SentencesByCaseSequence[], cur) => {
        if (acc.some(it => it.caseSequence === cur.caseSequence)) {
          const record = acc.find(it => it.caseSequence === cur.caseSequence)
          record.sentences.push(cur)
        } else {
          acc.push({ caseSequence: cur.caseSequence, sentences: [cur] } as SentencesByCaseSequence)
        }
        return acc
      }, [])
  }
}

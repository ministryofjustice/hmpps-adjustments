import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class TaggedBailSelectCaseModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}`
  }

  public activeSentences(): PrisonApiOffenderSentenceAndOffences[] {
    return this.sentencesAndOffences.filter(it => it.sentenceStatus === 'A')
  }
}

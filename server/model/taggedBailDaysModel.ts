import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

type SentencesByCaseSequence = {
  caseSequence: number
  sentences: PrisonApiOffenderSentenceAndOffences[]
}

export default class TaggedBailDaysModel {
  constructor(
      public prisonerDetail: PrisonApiPrisoner,
      private addOrEdit: string,
      private id: string) {}

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}`
  }
}

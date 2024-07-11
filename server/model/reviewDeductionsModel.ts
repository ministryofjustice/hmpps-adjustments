import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import {
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  getSentenceRecallTagHTML,
  isSentenceRecalled,
  offencesForRemandAdjustment,
  relevantSentenceForTaggedBailAdjustment,
  SentencesByCaseSequence,
} from '../utils/utils'

export default class ReviewDeductionsModel {
  private sentencesByCaseSequence: SentencesByCaseSequence[]

  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {
    this.sentencesByCaseSequence = getActiveSentencesByCaseSequence(this.sentencesAndOffences)
  }

  public pageHeading(): string {
    if (this.hasRemand() && this.hasTaggedBail()) {
      return 'Review and approve the remand dates and tagged bail days'
    }

    if (this.hasRemand()) {
      return 'Review and approve the remand dates'
    }

    if (this.hasTaggedBail()) {
      return 'Review and approve the tagged bail days'
    }

    return ''
  }

  public descriptionTextContext(): string {
    if (this.hasRemand() && this.hasTaggedBail()) {
      return 'remand and tagged bail'
    }

    if (this.hasRemand()) {
      return 'remand'
    }

    if (this.hasTaggedBail()) {
      return 'tagged bail'
    }

    return ''
  }

  public hasRemand(): boolean {
    return this.adjustments.filter(it => it.adjustmentType === 'REMAND').length > 0
  }

  public remand() {
    return this.adjustments
      .filter(it => it.adjustmentType === 'REMAND')
      .map(it => {
        return {
          ...it,
          daysToDisplay: it.days,
          offences: offencesForRemandAdjustment(it, this.sentencesAndOffences),
        }
      })
  }

  public hasTaggedBail(): boolean {
    return this.adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL').length > 0
  }

  public taggedBail(): Adjustment[] {
    return this.adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL')
  }

  public getSentenceAndOffence(adjustment: Adjustment): PrisonApiOffenderSentenceAndOffences {
    const sentencesForCaseSequence = this.sentencesByCaseSequence.find(sentencesByCaseSequence =>
      relevantSentenceForTaggedBailAdjustment(sentencesByCaseSequence, adjustment),
    )

    return getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences)
  }
}

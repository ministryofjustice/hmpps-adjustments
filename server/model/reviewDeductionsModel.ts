import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import {
  daysBetween,
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  offencesForRemandAdjustment,
  relevantSentenceForTaggedBailAdjustment,
  SentencesByCaseSequence,
} from '../utils/utils'
import SessionAdjustment from '../@types/AdjustmentTypes'

export default class ReviewDeductionsModel {
  private sentencesByCaseSequence: SentencesByCaseSequence[]

  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public sessionAdjustments: { id: string; adjustment: SessionAdjustment }[],
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
    if (this.hasAdjustmentTypeInSession('REMAND')) {
      return (
        this.adjustments.filter(it => it.adjustmentType === 'REMAND').length > 0 ||
        this.sessionAdjustments.filter(it => it.adjustment.adjustmentType === 'REMAND').length > 0
      )
    }

    return this.adjustments.filter(it => it.adjustmentType === 'REMAND').length > 0
  }

  public remand() {
    if (this.hasAdjustmentTypeInSession('REMAND')) {
      const remandAdjustments = this.sessionAdjustments
        .filter(it => it.adjustment.adjustmentType === 'REMAND')
        .map(it => {
          return {
            ...it.adjustment,
            daysToDisplay: daysBetween(new Date(it.adjustment.fromDate), new Date(it.adjustment.toDate)),
            offences: offencesForRemandAdjustment(it.adjustment, this.sentencesAndOffences),
          }
        })

      this.adjustments
        .filter(it => it.adjustmentType === 'REMAND')
        .forEach(it => {
          if (!this.sessionAdjustments.find(adj => adj.id === it.id)) {
            remandAdjustments.push({
              ...it,
              daysToDisplay: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
              offences: offencesForRemandAdjustment(it, this.sentencesAndOffences),
            })
          }
        })

      return remandAdjustments
    }

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
    if (this.hasAdjustmentTypeInSession('TAGGED_BAIL')) {
      return (
        this.adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL').length > 0 ||
        this.sessionAdjustments.filter(it => it.adjustment.adjustmentType === 'TAGGED_BAIL').length > 0
      )
    }

    return this.adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL').length > 0
  }

  public taggedBail(): Adjustment[] {
    if (this.hasAdjustmentTypeInSession('TAGGED_BAIL')) {
      const taggedBailAdjustments = this.sessionAdjustments
        .filter(it => it.adjustment.adjustmentType === 'TAGGED_BAIL')
        .map(it => {
          return {
            ...it.adjustment,
            daysToDisplay: it.adjustment.days,
            offences: offencesForRemandAdjustment(it.adjustment, this.sentencesAndOffences),
          }
        })

      this.adjustments
        .filter(it => it.adjustmentType === 'REMAND')
        .forEach(it => {
          if (!this.sessionAdjustments.find(adj => adj.id === it.id)) {
            taggedBailAdjustments.push({
              ...it,
              daysToDisplay: it.days,
              offences: offencesForRemandAdjustment(it, this.sentencesAndOffences),
            })
          }
        })

      return taggedBailAdjustments
    }

    return this.adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL')
  }

  private hasAdjustmentTypeInSession(adjustmentType: string): boolean {
    return (
      this.sessionAdjustments &&
      this.sessionAdjustments.length > 0 &&
      this.sessionAdjustments.filter(it => it.adjustment.adjustmentType === adjustmentType).length > 0
    )
  }

  public getSentenceAndOffence(adjustment: Adjustment): PrisonApiOffenderSentenceAndOffences {
    const sentencesForCaseSequence = this.sentencesByCaseSequence.find(sentencesByCaseSequence =>
      relevantSentenceForTaggedBailAdjustment(sentencesByCaseSequence, adjustment),
    )

    return getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences)
  }
}

import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { AdjustmentType } from './adjustmentTypes'
import {
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  SentencesByCaseSequence
} from '../utils/utils'

export default class TaggedBailViewModel {
  private sentencesByCaseSequence: SentencesByCaseSequence[]

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustments: Adjustment[],
    public adjustmentType: AdjustmentType,
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {
    this.sentencesByCaseSequence = getActiveSentencesByCaseSequence(this.sentencesAndOffences)
  }

  public backlink(): string {
    return `/${this.prisonerDetail.offenderNo}`
  }

  public columnHeadings() {
    return [{ text: 'Court name' }, { text: 'Case reference' }, { text: 'Days' }, { text: 'Actions' }]
  }

  public rows() {
    return this.adjustments.map(it => {
      return [
        { text: this.getCourtName(it.taggedBail.caseSequence) },
        { text: this.getCaseReference(it.taggedBail.caseSequence) },
        { text: it.days || it.daysBetween || it.effectiveDays },
        this.actionCell(it),
      ]
    })
  }

  public table() {
    return {
      head: this.columnHeadings(),
      rows: this.rows().concat(this.totalRow()),
      attributes: { 'data-qa': 'view-table' },
    }
  }

  public totalRow() {
    const total = this.adjustments.map(it => it.days || it.daysBetween || it.effectiveDays).reduce((a, b) => a + b, 0)
    return [[{ html: '<b>Total days</b>' }, { html: '' }, { html: `<b>${total}</b>` }, { text: '' }]]
  }

  private getCourtName(caseSequence: number): string {
    const sentencesForCaseSequence = this.sentencesByCaseSequence.find(it => it.caseSequence === caseSequence)
    if (sentencesForCaseSequence) {
      return getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences).courtDescription
    }

    return null
  }

  private getCaseReference(caseSequence: number): string {
    const sentencesForCaseSequence = this.sentencesByCaseSequence.find(it => it.caseSequence === caseSequence)
    if (sentencesForCaseSequence) {
      return getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences).caseReference
    }

    return null
  }

  private actionCell(adjustment: Adjustment) {
    return {
      html: `
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-one-quarter">
          <a class="govuk-link" href="/${adjustment.person}/tagged-bail/edit/${adjustment.id}" data-qa="edit-${adjustment.id}">Edit</a><br />
        </div>
        <div class="govuk-grid-column-one-quarter">
          <a class="govuk-link" href="/${adjustment.person}/tagged-bail/remove/${adjustment.id}" data-qa="delete-${adjustment.id}">Delete</a><br />
        </div>
      </div>
    `,
    }
  }
}

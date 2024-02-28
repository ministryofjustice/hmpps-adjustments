import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import {
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  getSentenceRecallTagHTML,
  isSentenceRecalled,
  relevantSentenceForTaggedBailAdjustment,
  SentencesByCaseSequence,
} from '../utils/utils'

export default class TaggedBailViewModel {
  private sentencesByCaseSequence: SentencesByCaseSequence[]

  constructor(
    public prisonerNumber: string,
    public adjustments: Adjustment[],
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {
    this.sentencesByCaseSequence = getActiveSentencesByCaseSequence(this.sentencesAndOffences)
  }

  public backlink(): string {
    return `/${this.prisonerNumber}`
  }

  public columnHeadings() {
    return [{ text: 'Court name' }, { text: 'Case reference' }, { text: 'Days' }, { text: 'Actions' }]
  }

  public rows() {
    return this.adjustments.map(it => {
      const sentencesForCaseSequence = this.sentencesByCaseSequence.find(sentencesByCaseSequence =>
        relevantSentenceForTaggedBailAdjustment(sentencesByCaseSequence, it),
      )
      const sentenceAndOffence = getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences)

      const recall = isSentenceRecalled(sentencesForCaseSequence.sentences[0].sentenceCalculationType)
      const descriptionRow = recall
        ? { html: `${sentenceAndOffence.courtDescription} ${getSentenceRecallTagHTML()}` }
        : { text: sentenceAndOffence.courtDescription }

      return [descriptionRow, { text: sentenceAndOffence.caseReference }, { text: it.days }, this.actionCell(it)]
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
    const total = this.adjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    return [[{ html: '<b>Total days</b>' }, { html: '' }, { html: `<b>${total}</b>` }, { text: '' }]]
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

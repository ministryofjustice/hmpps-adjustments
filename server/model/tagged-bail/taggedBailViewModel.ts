import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import {
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  getSentenceRecallTagHTML,
  relevantSentenceForTaggedBailAdjustment,
  SentencesByCaseSequence,
} from '../../utils/utils'
import UnusedDeductionsMessageViewModel from '../unused-deductions/unusedDeductionsMessageViewModel'
import { UnusedDeductionMessageType } from '../../services/unusedDeductionsService'
import RemandAndSentencingService from '../../services/remandAndSentencingService'

export default class TaggedBailViewModel {
  private sentencesByCaseSequence: SentencesByCaseSequence[]

  public adjustments: Adjustment[]

  public unusedDeductionMessage: UnusedDeductionsMessageViewModel

  constructor(
    public prisonerNumber: string,
    public allAdjustments: Adjustment[],
    public sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    unusedDeductionsMessageType: UnusedDeductionMessageType,
    inactiveWhenDeletedAdjustments: Adjustment[],
    public remandAndSentencingService: RemandAndSentencingService,
  ) {
    this.sentencesByCaseSequence = getActiveSentencesByCaseSequence(this.sentencesAndOffences)
    this.adjustments = allAdjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL')
    this.unusedDeductionMessage = new UnusedDeductionsMessageViewModel(
      prisonerNumber,
      allAdjustments,
      unusedDeductionsMessageType,
      inactiveWhenDeletedAdjustments,
      false,
    )
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
      let recall = false
      let caseReference: string
      let courtDescription: string
      let canEdit: boolean
      if (sentencesForCaseSequence) {
        const sentenceAndOffence = getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences)

        recall = this.remandAndSentencingService.isSentenceRecalled(
          sentencesForCaseSequence.sentences[0].sentenceCalculationType,
        )
        caseReference = sentenceAndOffence.caseReference
        courtDescription = sentenceAndOffence.courtDescription
        canEdit = true
      } else {
        caseReference = 'Unknown'
        courtDescription = 'Unknown'
        canEdit = false
      }

      const descriptionRow = recall
        ? { html: `${courtDescription} ${getSentenceRecallTagHTML()}` }
        : { text: courtDescription }

      return [
        descriptionRow,
        { text: caseReference },
        { text: it.days },
        this.actionCell(it, caseReference, courtDescription, canEdit),
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
    const total = this.adjustments.map(it => it.days).reduce((a, b) => a + b, 0)
    return [[{ html: '<b>Total days</b>' }, { html: '' }, { html: `<b>${total}</b>` }, { text: '' }]]
  }

  private actionCell(adjustment: Adjustment, caseReference: string, courtDescription: string, canEdit: boolean) {
    const visuallyHiddenText = caseReference
      ? `tagged bail for case ${caseReference} at ${courtDescription}`
      : `${adjustment.days} days of tagged bail at ${courtDescription}`

    let html = ''
    if (canEdit) {
      html += `
      <div class="govuk-grid-column-one-quarter govuk-!-margin-right-2 govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/tagged-bail/edit/${adjustment.id}" data-qa="edit-${adjustment.id}">Edit<span class="govuk-visually-hidden"> ${visuallyHiddenText}</span></a><br />
      </div>`
    }
    html += `
      <div class="govuk-grid-column-one-half govuk-!-padding-0">
        <a class="govuk-link" href="/${adjustment.person}/tagged-bail/remove/${adjustment.id}" data-qa="delete-${adjustment.id}">Delete<span class="govuk-visually-hidden"> ${visuallyHiddenText}</span></a><br />
      </div>
    `
    return { html }
  }
}

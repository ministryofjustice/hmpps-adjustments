import SessionAdjustment from '../../@types/AdjustmentTypes'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { daysBetween, groupBy } from '../../utils/utils'
import RemandOffencesForm from './remandOffencesForm'
import RemandAndSentencingService from '../../services/remandAndSentencingService'

export default class RemandSelectOffencesModel {
  public cases: Map<number, PrisonApiOffenderSentenceAndOffences[]>

  constructor(
    public id: string,
    public prisonerNumber: string,
    public adjustment: SessionAdjustment,
    public form: RemandOffencesForm,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public addOrEdit: string = null,
    public remandAndSentencingService: RemandAndSentencingService,
  ) {
    this.cases = groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence)
  }

  public backlink(): string {
    if (this.addOrEdit === 'edit') return `/${this.prisonerNumber}/remand/edit/${this.id}`
    if (this.adjustment.complete) {
      return `/${this.prisonerNumber}/remand/review`
    }
    return `/${this.prisonerNumber}/remand/dates/add/${this.id}`
  }

  public days(): number {
    return daysBetween(new Date(this.adjustment.fromDate), new Date(this.adjustment.toDate))
  }

  public getOffences(
    sentence: PrisonApiOffenderSentenceAndOffences,
  ): PrisonApiOffence & { recall: boolean; isChecked: boolean }[] {
    return sentence.offences.map(off => {
      return {
        ...off,
        recall: this.remandAndSentencingService.isSentenceRecalled(sentence.sentenceCalculationType),
        isChecked: this.form.isChecked(off.offenderChargeId),
      }
    })
  }

  public caseSummary(sentence: PrisonApiOffenderSentenceAndOffences) {
    const rows = []
    if (sentence.courtDescription) {
      rows.push({
        key: {
          text: 'Court name',
        },
        value: {
          text: sentence.courtDescription,
        },
      })
    }
    if (sentence.caseReference) {
      rows.push({
        key: {
          text: 'Case reference',
        },
        value: {
          text: sentence.caseReference,
        },
      })
    }
    return rows
  }
}

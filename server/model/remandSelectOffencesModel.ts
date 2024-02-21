import SessionAdjustment from '../@types/AdjustmentTypes'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
import PrisonerService from '../services/prisonerService'
import { daysBetween, groupBy } from '../utils/utils'
import RemandOffencesForm from './remandOffencesForm'

export default class RemandSelectOffencesModel {
  public cases: Map<number, PrisonApiOffenderSentenceAndOffences[]>

  constructor(
    public id: string,
    public prisonerNumber: string,
    public adjustment: SessionAdjustment,
    public form: RemandOffencesForm,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public addOrEdit: string = null,
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

  public getOffences(sentence: PrisonApiOffenderSentenceAndOffences): PrisonApiOffence & { recall: boolean }[] {
    return sentence.offences.map(off => {
      return { ...off, recall: PrisonerService.recallTypes.includes(sentence.sentenceCalculationType) }
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

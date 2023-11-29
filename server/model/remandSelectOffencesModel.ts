import SessionAdjustment from '../@types/AdjustmentTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween, groupBy } from '../utils/utils'
import RemandOffencesForm from './remandOffencesForm'

export default class RemandSelectOffencesModel {
  public cases: Map<number, PrisonApiOffenderSentenceAndOffences[]>

  constructor(
    public id: string,
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: SessionAdjustment,
    public form: RemandOffencesForm,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {
    this.cases = groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence)
  }

  public backlink(): string {
    if (this.adjustment.complete) {
      return `/${this.prisonerDetail.offenderNo}/remand/review`
    }
    return `/${this.prisonerDetail.offenderNo}/remand/dates/add/${this.id}`
  }

  public days(): number {
    return daysBetween(new Date(this.adjustment.fromDate), new Date(this.adjustment.toDate))
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

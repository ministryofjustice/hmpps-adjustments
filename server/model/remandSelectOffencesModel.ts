import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { daysBetween, groupBy } from '../utils/utils'
import RemandOffencesForm from './remandOffencesForm'

export default class RemandSelectOffencesModel {
  public cases: Map<number, PrisonApiOffenderSentenceAndOffences[]>

  constructor(
    public id: string,
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    public form: RemandOffencesForm,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {
    this.cases = groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence)
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

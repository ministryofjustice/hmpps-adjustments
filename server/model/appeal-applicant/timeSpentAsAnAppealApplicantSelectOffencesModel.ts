import SessionAdjustment from '../../@types/AdjustmentTypes'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { groupBy } from '../../utils/utils'
import TimeSpentAsAnAppealApplicantOffencesForm from './timeSpentAsAnAppealApplicantOffencesForm'

export default class TimeSpentAsAnAppealApplicantSelectOffencesModel {
  public cases: Map<number, PrisonApiOffenderSentenceAndOffences[]>

  constructor(
    public id: string,
    public prisonerNumber: string,
    public adjustment: SessionAdjustment,
    public form: TimeSpentAsAnAppealApplicantOffencesForm,
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    public addOrEdit: string = null,
  ) {
    this.cases = groupBy(sentencesAndOffences, (sent: PrisonApiOffenderSentenceAndOffences) => sent.caseSequence)
  }

  public backlink(): string {
    return `/${this.prisonerNumber}/appeal-applicant/reference/${this.addOrEdit}/${this.id}`
  }

  public days(): number {
    return this.adjustment.days
  }

  public getOffences(sentence: PrisonApiOffenderSentenceAndOffences): PrisonApiOffence & { isChecked: boolean }[] {
    return sentence.offences.map(off => {
      return {
        ...off,
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

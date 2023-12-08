import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import {
  PrisonApiOffence,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
} from '../@types/prisonApi/prisonClientTypes'

export default class RemandRemoveModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public listOffences() {
    const offences = this.sentencesAndOffences.flatMap(so => {
      return so.offences.filter(off => this.adjustment.remand.chargeId.includes(off.offenderChargeId))
    })

    const offenceListHtml = offences.reduce(
      (html, o) =>
        `${html}<li>${o.offenceDescription}<br><span class='govuk-hint'>${this.getOffenceCommittedText(o)}</span></li>`,
      '',
    )
    return `<ul class='govuk-list'>${offenceListHtml}</ul>`
  }

  public remandDays() {
    return this.adjustment.daysBetween || this.adjustment.effectiveDays
  }

  private getOffenceCommittedText(offence: PrisonApiOffence) {
    if (offence.offenceEndDate && offence.offenceStartDate && offence.offenceEndDate !== offence.offenceStartDate) {
      return `Committed from ${dayjs(offence.offenceStartDate).format('DD MMMM YYYY')} to ${dayjs(
        offence.offenceEndDate,
      ).format('DD MMMM YYYY')}`
    }
    if (offence.offenceStartDate) {
      return `Committed on ${dayjs(offence.offenceStartDate).format('DD MMMM YYYY')}`
    }
    if (offence.offenceStartDate) {
      return `Committed on ${dayjs(offence.offenceStartDate).format('DD MMMM YYYY')}`
    }

    return 'Offence date not entered'
  }
}

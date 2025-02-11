import dayjs from 'dayjs'
import SessionAdjustment from '../../@types/AdjustmentTypes'
import timeSpentInCustodyAbroadDocumentationSource from './timeSpentInCustodyAbroadDocumentationSource'
import { offencesForTimeSpentInCustodyAbroadAdjustment } from '../../utils/utils'
import { PrisonApiOffence, PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'

export default class TimeSpentInCustodyAbroadReviewModel {
  constructor(
    public nomsId: string,
    public id: string,
    public addOrEdit: string,
    public adjustment: SessionAdjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
  ) {}

  public backlink(): string {
    return `/${this.nomsId}/custody-abroad/offences/${this.addOrEdit}/${this.id}`
  }

  public timeSpentInCustodyAbroadDocumentationSource(): string {
    return timeSpentInCustodyAbroadDocumentationSource.find(
      it => it.value === this.adjustment.timeSpentInCustodyAbroad?.documentationSource,
    ).text
  }

  public cancelLink(): string {
    return `/${this.nomsId}/`
  }

  public offenceSummary() {
    const offences = offencesForTimeSpentInCustodyAbroadAdjustment(this.adjustment, this.sentencesAndOffences)
    return {
      key: {
        text: 'Offences',
      },
      value: {
        html: `<div>
                    ${offences
                      .map(it => {
                        return `<div><span class="govuk-!-font-weight-bold">${it.offenceDescription}</span><br>
                        <span class="govuk-body-s">
                          ${this.getCommittedText(it, true)}
                        </span><br>
                        <span class="govuk-body-s">
                          ${this.getHeardAtCourt(it)}
                        </span>
                        </div>`
                      })
                      .join('')}
                  </div>`,
      },
      actions: {
        items: [
          {
            href: `/${this.nomsId}/custody-abroad/offences/${this.addOrEdit}/${this.id}`,
            text: 'Edit',
            visuallyHiddenText: `offences. ${offences
              .map(it => {
                return `${it.offenceDescription} ${this.getCommittedText(it, false)}`
              })
              .join('. ')}`,
          },
        ],
      },
    }
  }

  public getCommittedText(offence: PrisonApiOffence, noWrapDate: boolean): string {
    let committedText
    if (offence.offenceEndDate && offence.offenceStartDate && offence.offenceEndDate !== offence.offenceStartDate) {
      committedText = `Committed from ${this.formatDate(offence.offenceStartDate, noWrapDate)} to ${this.formatDate(offence.offenceEndDate, noWrapDate)}`
    } else if (offence.offenceStartDate) {
      committedText = `Committed on ${this.formatDate(offence.offenceStartDate, noWrapDate)}`
    } else if (offence.offenceEndDate) {
      committedText = `Committed on ${this.formatDate(offence.offenceEndDate, noWrapDate)}`
    } else {
      committedText = 'Offence date not entered'
    }
    return committedText
  }

  private formatDate(date: string, noWrapDate: boolean) {
    const formattedDate = dayjs(date).format('D MMMM YYYY')
    return noWrapDate ? `<span class="govuk-!-white-space-nowrap">${formattedDate}</span> ` : formattedDate
  }

  public getHeardAtCourt(offence: PrisonApiOffence & { courtDescription: string }): string {
    return `Heard at ${offence.courtDescription}`
  }
}

import dayjs from 'dayjs'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { offencesForRemandAdjustment } from '../../utils/utils'
import UnusedDeductionsMessageViewModel from '../unused-deductions/unusedDeductionsMessageViewModel'
import { UnusedDeductionMessageType } from '../../services/unusedDeductionsService'
import { IdentifyRemandDecision, RemandResult } from '../../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
import config from '../../config'

export default class RemandViewModel {
  public adjustments: Adjustment[]

  public unusedDeductionMessage: UnusedDeductionsMessageViewModel

  constructor(
    public prisonerNumber: string,
    allAdjustments: Adjustment[],
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    unusedDeductionsMessageType: UnusedDeductionMessageType,
    inactiveWhenDeletedAdjustments: Adjustment[],
    public roles: string[],
    public remandDecision: IdentifyRemandDecision,
    public remandResult: RemandResult,
  ) {
    this.adjustments = allAdjustments.filter(it => it.adjustmentType === 'REMAND')
    this.unusedDeductionMessage = new UnusedDeductionsMessageViewModel(
      prisonerNumber,
      allAdjustments,
      unusedDeductionsMessageType,
      inactiveWhenDeletedAdjustments,
      false,
    )
  }

  public remandSingleLineDetails() {
    return [
      ...this.adjustmentsWithOffences().map(it => {
        return [
          { text: `${dayjs(it.fromDate).format('D MMMM YYYY')}` },
          { text: `${dayjs(it.toDate).format('D MMMM YYYY')}` },
          { text: it.days },
          { html: it.offences ? it.offences.map(offence => offence.offenceDescription).join('<br>') : 'No offences' },
          {
            html: it.offences
              ? it.offences.map(offence => `${dayjs(offence.offenceStartDate).format('D MMMM YYYY')}`).join('<br>')
              : 'No offences',
          },
        ]
      }),
      [
        { text: 'Total days', classes: 'govuk-table__header' },
        {},
        { html: `<strong>${this.totalDays()} days</strong>` },
        {},
        {},
      ],
    ]
  }

  private getRemandRejectionBanner(): string {
    return `<h2 class="govuk-heading-m remand-rejection-banner-title">The remand below has been entered manually</h2>
            <br>
            The remand tool was rejected on <strong>${dayjs(this.remandDecision?.decisionOn).format('D MMMM YYYY')}</strong>. 
            The reason given was <strong>${this.remandDecision?.rejectComment}</strong>.
            <br>
            You can <a href="${this.getRemandToolUrl()}">check the remand tool</a>. 
            This will not clear the below manual entries unless you choose to accept the remand tool.`
  }

  public adjustmentsWithOffences() {
    return this.adjustments.map(it => {
      return {
        ...it,
        daysToDisplay: it.days,
        offences: offencesForRemandAdjustment(it, this.sentencesAndOffences),
      }
    })
  }

  public totalDays() {
    return this.adjustments.reduce((sum, it) => sum + it.days, 0)
  }

  public readonly() {
    return this.remandToolIsAccessible() && !this.remandIsRejected()
  }

  public remandIsRejected() {
    return this.remandDecision?.accepted === false
  }

  public getRemandToolUrl(): string {
    return `${config.services.identifyRemandPeriods.url}/prisoner/${this.prisonerNumber}`
  }

  private hasRemandToolRole(): boolean {
    return this.roles.indexOf('REMAND_IDENTIFIER') !== -1
  }

  public remandToolIsAccessible(): boolean {
    return this.hasRemandToolRole() && !!this.remandResult
  }
}

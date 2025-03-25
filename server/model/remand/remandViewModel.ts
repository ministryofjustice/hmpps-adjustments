import dayjs from 'dayjs'
import { Adjustment } from '../../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../../@types/prisonApi/prisonClientTypes'
import { offencesForRemandAdjustment } from '../../utils/utils'
import UnusedDeductionsMessageViewModel from '../unused-deductions/unusedDeductionsMessageViewModel'
import { UnusedDeductionMessageType } from '../../services/unusedDeductionsService'
import { IdentifyRemandDecision } from '../../@types/identifyRemandPeriods/identifyRemandPeriodsTypes'
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
    return this.hasIdentifyRemandRole() && this.remandDecision?.accepted !== false
  }

  public getRemandToolUrl(): string {
    return `${config.services.identifyRemandPeriods.url}/prisoner/${this.prisonerNumber}`
  }

  public hasIdentifyRemandRole(): boolean {
    return this.roles.indexOf('REMAND_IDENTIFIER') !== -1
  }
}

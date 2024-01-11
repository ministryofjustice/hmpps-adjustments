import dayjs from 'dayjs'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { PrisonApiOffenderSentenceAndOffences, PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { CalculateReleaseDatesValidationMessage } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { calculateReleaseDatesCheckInformationUrl, offencesForAdjustment } from '../utils/utils'

export default class RemandChangeModel {
  remandRelatedValidationCodes = ['REMAND_OVERLAPS_WITH_REMAND', 'REMAND_OVERLAPS_WITH_SENTENCE']

  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    private sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[],
    private calculateReleaseDatesValidationMessages: CalculateReleaseDatesValidationMessage[] = [],
  ) {}

  public listOffences() {
    return offencesForAdjustment(this.adjustment, this.sentencesAndOffences)
  }

  private remandRelatedValidation() {
    return this.calculateReleaseDatesValidationMessages.filter(it =>
      this.remandRelatedValidationCodes.includes(it.code),
    )
  }

  public remandRelatedValidationSummary() {
    const message = this.remandRelatedValidation().length ? this.remandRelatedValidation()[0] : null
    if (!message) {
      return {
        errorList: [] as string[],
      }
    }
    const overlapsWithRemand = message.code === 'REMAND_OVERLAPS_WITH_REMAND'
    return {
      titleText: overlapsWithRemand
        ? 'Remand time cannot overlap'
        : 'Remand cannot be applied when a sentence is being served.',
      errorList: [
        {
          text: `The remand dates from ${dayjs(message.arguments[2]).format('DD MMM YYYY')} to ${dayjs(
            message.arguments[3],
          ).format('DD MMM YYYY')} overlaps with ${
            overlapsWithRemand ? 'another remand period' : 'a sentence'
          } from ${dayjs(message.arguments[0]).format('DD MMM YYYY')} to ${dayjs(message.arguments[1]).format(
            'DD MMM YYYY',
          )}`,
        },
      ],
      subText: {
        html: overlapsWithRemand
          ? '<p>To continue, edit the remand days that overlap or Cancel.</p>'
          : `<p>Update the remand dates to continue.</p><p>You can view the court case & sentence information in the <a href="${calculateReleaseDatesCheckInformationUrl(
              this.prisonerDetail,
            )}">Calculate release dates service</a>.</p>`,
      },
    }
  }
}

import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { Adjustment, ValidationMessage } from '../@types/adjustments/adjustmentsTypes'
import WarningForm from './warningForm'

export default class WarningModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: Adjustment,
    public validationMessage: ValidationMessage,
    public form: WarningForm,
  ) {}

  question() {
    if (this.validationMessage.code === 'RADA_REDUCES_BY_MORE_THAN_HALF') {
      return this.validationMessage.message
    }
    return ''
  }

  hint() {
    return 'The RADA time should not be more than 50% of the ADA time.<br /><br /> The Governor can restore up to 50% of the total ADAs that have been imposed. In very exceptional circumstances Governors may remit up to 100%.'
  }
}

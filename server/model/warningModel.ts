import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import { AdjustmentDetails, ValidationMessage } from '../@types/adjustments/adjustmentsTypes'
import WarningForm from './warningForm'

export default class WarningModel {
  constructor(
    public prisonerDetail: PrisonApiPrisoner,
    public adjustment: AdjustmentDetails,
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
    return 'This hint should help.'
  }
}

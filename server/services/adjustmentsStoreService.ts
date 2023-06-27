import { Request } from 'express'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsStoreService {
  public store(req: Request, nomsId: string, adjustment: AdjustmentDetails): void {
    if (!req.session.adjustments) {
      req.session.adjustments = {}
    }
    req.session.adjustments[nomsId] = adjustment
  }

  public get(req: Request, nomsId: string): AdjustmentDetails {
    if (!req.session.adjustments) {
      req.session.adjustments = {}
    }
    return req.session.adjustments[nomsId]
  }
}

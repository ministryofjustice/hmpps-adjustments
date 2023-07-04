import { Request } from 'express'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsStoreService {
  public store(req: Request, nomsId: string, adjustment: Adjustment): void {
    if (!req.session.adjustments) {
      req.session.adjustments = {}
    }
    req.session.adjustments[nomsId] = adjustment
  }

  public get(req: Request, nomsId: string): Adjustment {
    if (!req.session.adjustments) {
      req.session.adjustments = {}
    }
    return req.session.adjustments[nomsId]
  }
}

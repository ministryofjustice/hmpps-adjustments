import { Request } from 'express'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsStoreService {
  public store(req: Request, nomsId: string, adjustment: AdjustmentDetails): void {
    if (!req.session.adjustments) {
      req.session.adjustments = {}
    }
    if (!req.session.adjustments[nomsId]) {
      req.session.adjustments[nomsId] = []
    }
    req.session.adjustments[nomsId].push(adjustment)
  }

  public get(req: Request, nomsId: string): AdjustmentDetails[] {
    if (!req.session.adjustments) {
      req.session.adjustments = {}
    }
    if (!req.session.adjustments[nomsId]) {
      req.session.adjustments[nomsId] = []
    }
    return req.session.adjustments[nomsId]
  }
}

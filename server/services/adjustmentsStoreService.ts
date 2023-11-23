import { Request } from 'express'
import { randomUUID } from 'crypto'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsStoreService {
  private initSessionForNomsId(req: Request, nomsId: string) {
    if (!req.session.adjustments) {
      req.session.adjustments = {}
    }
    if (!req.session.adjustments[nomsId]) {
      req.session.adjustments[nomsId] = {}
    }
  }

  public clear(req: Request, nomsId: string) {
    this.initSessionForNomsId(req, nomsId)
    req.session.adjustments[nomsId] = {}
  }

  /* Functions for forms that create adjustments one at a time */
  public getOnly(req: Request, nomsId: string): Adjustment {
    this.initSessionForNomsId(req, nomsId)
    const key = Object.keys(req.session.adjustments[nomsId])[0]
    return req.session.adjustments[nomsId][key]
  }

  public storeOnly(req: Request, nomsId: string, adjustment: Adjustment) {
    this.initSessionForNomsId(req, nomsId)
    const keys = Object.keys(req.session.adjustments[nomsId])
    if (keys.length) {
      const key = keys[0]
      req.session.adjustments[nomsId][key] = adjustment
    } else {
      const id = randomUUID()
      req.session.adjustments[nomsId][id] = adjustment
    }
  }

  /* Functions for forms that create multiple */
  public store(req: Request, nomsId: string, reqId: string, adjustment: Adjustment): string {
    this.initSessionForNomsId(req, nomsId)
    const id = reqId || randomUUID()
    req.session.adjustments[nomsId][id] = adjustment
    return id
  }

  public getById(req: Request, nomsId: string, id: string): Adjustment {
    this.initSessionForNomsId(req, nomsId)
    return req.session.adjustments[nomsId][id]
  }

  public getAll(req: Request, nomsId: string): { string?: Adjustment } {
    this.initSessionForNomsId(req, nomsId)
    return req.session.adjustments[nomsId]
  }
}

import { Request } from 'express'
import { PreviousUnlawfullyAtLargeReviewRequest } from '../@types/adjustments/adjustmentsTypes'

export default class PreviousUnlawfullyAtLargeReviewStoreService {
  public storeReview(req: Request, nomsId: string, review: PreviousUnlawfullyAtLargeReviewRequest): void {
    if (!req.session.previousUalReview) {
      req.session.previousUalReview = {}
    }
    req.session.previousUalReview[nomsId] = review
  }

  public getReview(req: Request, nomsId: string): PreviousUnlawfullyAtLargeReviewRequest {
    if (!req.session.previousUalReview) {
      req.session.previousUalReview = {}
    }
    return req.session.previousUalReview[nomsId] || { acceptedAdjustmentIds: [], rejectedAdjustmentIds: [] }
  }

  public clearReview(req: Request, nomsId: string): void {
    if (!req.session.previousUalReview) {
      req.session.previousUalReview = {}
    }
    delete req.session.previousUalReview[nomsId]
  }
}

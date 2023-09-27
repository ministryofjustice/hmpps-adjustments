import { Request } from 'express'

/**
 * This is a temporary solution, to not keep showing the PADA screens, until we have a route into the service.
 *
 * Future solution ->
 *
 * 1. Link into adjustments services goes to start page, or at least a start URL.
 * 2. Check the intercept logic on the start URL.
 * 3. Remove intercept logic from adjustments hub route.
 *
 * This means we will only check the intercept the first time the user comes to our service, not when they're just navigating the adjustments hub.
 *
 * TODO ADJUST1-207
 */
export default class AdditionalDaysAwardedStoreService {
  public approve(req: Request, nomsId: string): void {
    if (!req.session.additionalDayApprovals) {
      req.session.additionalDayApprovals = {}
    }
    req.session.additionalDayApprovals[nomsId] = new Date()
  }

  public get(req: Request, nomsId: string): Date {
    if (!req.session.additionalDayApprovals) {
      req.session.additionalDayApprovals = {}
    }
    return req.session.additionalDayApprovals[nomsId]
  }
}

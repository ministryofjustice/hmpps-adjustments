import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import AdjustmentRoutes from './adjustmentRoutes'
import AdditionalDaysAwardedRoutes from './additionalDaysAwardedRoutes'
import RemandRoutes from './remandRoutes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(service: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const adjustmentRoutes = new AdjustmentRoutes(
    service.prisonerService,
    service.adjustmentsService,
    service.identifyRemandPeriodsService,
    service.adjustmentsStoreService,
    service.additionalDaysAwardedService,
  )
  const remandRoutes = new RemandRoutes(
    service.prisonerService,
    service.adjustmentsService,
    service.adjustmentsStoreService,
  )

  const additionalDaysAwardedRoutes = new AdditionalDaysAwardedRoutes(
    service.prisonerService,
    service.additionalDaysAwardedService,
  )

  get('/', (req, res, next) => {
    res.render('pages/index')
  })

  get('/', adjustmentRoutes.entry)
  get('/:nomsId/start', adjustmentRoutes.start)
  get('/:nomsId', adjustmentRoutes.hub)
  get('/:nomsId/success', adjustmentRoutes.success)
  get('/:nomsId/warning', adjustmentRoutes.warning)
  post('/:nomsId/warning', adjustmentRoutes.submitWarning)
  get('/:nomsId/review', adjustmentRoutes.review)
  post('/:nomsId/review', adjustmentRoutes.submitReview)

  get('/:nomsId/additional-days/intercept', additionalDaysAwardedRoutes.intercept)
  get('/:nomsId/additional-days/review-prospective', additionalDaysAwardedRoutes.reviewPadas)
  post('/:nomsId/additional-days/review-prospective', additionalDaysAwardedRoutes.submitPadas)
  get('/:nomsId/additional-days/review-and-approve', additionalDaysAwardedRoutes.reviewAndApprove)
  post('/:nomsId/additional-days/review-and-approve', additionalDaysAwardedRoutes.approve)
  get('/:nomsId/additional-days/review-and-submit', additionalDaysAwardedRoutes.reviewAndSubmit)
  post('/:nomsId/additional-days/review-and-submit', additionalDaysAwardedRoutes.submit)
  get('/:nomsId/additional-days/view', additionalDaysAwardedRoutes.view)
  get('/:nomsId/additional-days/add', additionalDaysAwardedRoutes.addWarning)

  get('/:nomsId/remand/add', remandRoutes.add)
  get('/:nomsId/remand/dates/:addOrEdit/:id', remandRoutes.dates)
  post('/:nomsId/remand/dates/:addOrEdit/:id', remandRoutes.submitDates)
  get('/:nomsId/remand/offences/:addOrEdit/:id', remandRoutes.offences)
  post('/:nomsId/remand/offences/:addOrEdit/:id', remandRoutes.submitOffences)

  get('/:nomsId/:adjustmentTypeUrl/view', adjustmentRoutes.view)
  get('/:nomsId/:adjustmentTypeUrl/remove/:id', adjustmentRoutes.remove)
  post('/:nomsId/:adjustmentTypeUrl/remove/:id', adjustmentRoutes.submitRemove)
  get('/:nomsId/:adjustmentTypeUrl/:addOrEdit', adjustmentRoutes.form)
  post('/:nomsId/:adjustmentTypeUrl/:addOrEdit', adjustmentRoutes.submitForm)
  get('/:nomsId/:adjustmentTypeUrl/:addOrEdit/:id', adjustmentRoutes.form)
  post('/:nomsId/:adjustmentTypeUrl/:addOrEdit/:id', adjustmentRoutes.submitForm)

  get('/:nomsId/remand', adjustmentRoutes.remand)
  get('/:nomsId/additional-days/add', adjustmentRoutes.additionalDays)

  return router
}

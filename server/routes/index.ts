import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import AdjustmentRoutes from './adjustmentRoutes'
import AdjustmentTestRoutes from './testRoutes'

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
  )
  const adjustmentTestRoutes = new AdjustmentTestRoutes(service.prisonerService, service.adjustmentsService)

  get('/', (req, res, next) => {
    res.render('pages/index')
  })

  get('/', adjustmentRoutes.entry)
  get('/:nomsId/start', adjustmentRoutes.start)
  get('/:nomsId', adjustmentRoutes.list)
  get('/:nomsId/success', adjustmentRoutes.success)
  get('/:nomsId/warning', adjustmentRoutes.warning)
  post('/:nomsId/warning', adjustmentRoutes.submitWarning)
  get('/:nomsId/review', adjustmentRoutes.review)
  post('/:nomsId/review', adjustmentRoutes.submitReview)

  get('/:nomsId/remand', adjustmentRoutes.remand)
  get('/:nomsId/additional-days/add', adjustmentRoutes.additionalDays)
  get('/:nomsId/restored-additional-days/add', adjustmentRoutes.restoredAdditionalDays)
  post('/:nomsId/restored-additional-days/add', adjustmentRoutes.submitRestoredAdditionalDays)
  get('/:nomsId/:adjustmentTypeUrl/view', adjustmentRoutes.view)

  get('/test/:nomsId', adjustmentTestRoutes.list)
  get('/test/:nomsId/create', adjustmentTestRoutes.create)
  get('/test/:nomsId/edit/:adjustmentId', adjustmentTestRoutes.update)
  post('/test/:nomsId/create', adjustmentTestRoutes.submitAdjustment)
  post('/test/:nomsId/edit/:adjustmentId', adjustmentTestRoutes.submitAdjustment)
  post('/test/:nomsId/delete/:adjustmentId', adjustmentTestRoutes.deleteAdjustment)

  return router
}

import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import AdjustmentRoutes from './adjustmentRoutes'
import AdditionalDaysAwardedRoutes from './additionalDaysAwardedRoutes'
import RemandRoutes from './remandRoutes'
import TaggedBailRoutes from './taggedBailRoutes'
import PrisonerImageRoutes from './prisonerImageRoutes'
import ManualUnusedDeductionRoutes from './manualUnusedDeductionRoutes'
import ReviewUnusedDeductionRoutes from './reviewUnusedDeductionRoutes'
import SpecialRemissionRoutes from './specialRemissionRoutes'

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
    service.unusedDeductionsService,
    service.paramStoreService,
  )
  const remandRoutes = new RemandRoutes(
    service.prisonerService,
    service.adjustmentsService,
    service.adjustmentsStoreService,
    service.calculateReleaseDatesService,
    service.paramStoreService,
    service.unusedDeductionsService,
    service.identifyRemandPeriodsService,
  )

  const additionalDaysAwardedRoutes = new AdditionalDaysAwardedRoutes(
    service.prisonerService,
    service.additionalDaysAwardedBackendService,
    service.adjustmentsService,
  )

  const taggedBailRoutes = new TaggedBailRoutes(
    service.prisonerService,
    service.adjustmentsService,
    service.adjustmentsStoreService,
    service.calculateReleaseDatesService,
    service.paramStoreService,
    service.unusedDeductionsService,
  )

  const manualUnusedDeductionRoutes = new ManualUnusedDeductionRoutes(
    service.prisonerService,
    service.adjustmentsService,
    service.adjustmentsStoreService,
  )

  const reviewUnusedDeductionRoutes = new ReviewUnusedDeductionRoutes(
    service.prisonerService,
    service.adjustmentsService,
    service.adjustmentsStoreService,
    service.paramStoreService,
    service.calculateReleaseDatesService,
  )

  const specialRemissionRoutes = new SpecialRemissionRoutes(
    service.adjustmentsStoreService,
    service.adjustmentsService,
    service.prisonerService,
  )

  const prisonerImageRoutes = new PrisonerImageRoutes(service.prisonerService)

  get('/', (req, res, next) => {
    res.render('pages/index')
  })

  get('/:nomsId/image', prisonerImageRoutes.getImage)

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
  get('/:nomsId/additional-days/remove-prospective/:dateChargeProved', additionalDaysAwardedRoutes.removeProspective)
  post(
    '/:nomsId/additional-days/remove-prospective/:dateChargeProved',
    additionalDaysAwardedRoutes.submitRemoveProspective,
  )

  get('/:nomsId/remand/add', remandRoutes.add)
  get('/:nomsId/remand/dates/:addOrEdit/:id', remandRoutes.dates)
  post('/:nomsId/remand/dates/:addOrEdit/:id', remandRoutes.submitDates)
  get('/:nomsId/remand/offences/:addOrEdit/:id', remandRoutes.offences)
  post('/:nomsId/remand/offences/:addOrEdit/:id', remandRoutes.submitOffences)
  get('/:nomsId/remand/session/remove/:id', remandRoutes.removeFromSession)
  get('/:nomsId/remand/review', remandRoutes.review)
  post('/:nomsId/remand/review', remandRoutes.submitReview)
  get('/:nomsId/remand/save', remandRoutes.save)
  post('/:nomsId/remand/save', remandRoutes.submitSave)
  get('/:nomsId/remand/view', remandRoutes.view)
  get('/:nomsId/remand/remove/:id', remandRoutes.remove)
  get('/:nomsId/remand/edit/:id', remandRoutes.edit)
  post('/:nomsId/remand/edit/:id', remandRoutes.submitEdit)
  get('/:nomsId/remand/no-applicable-sentences', remandRoutes.noApplicableSentences)

  get('/:nomsId/tagged-bail/add', taggedBailRoutes.add)
  get('/:nomsId/tagged-bail/view', taggedBailRoutes.view)
  get('/:nomsId/tagged-bail/remove/:id', taggedBailRoutes.remove)
  get('/:nomsId/tagged-bail/select-case/:addOrEdit/:id', taggedBailRoutes.selectCase)
  get('/:nomsId/tagged-bail/days/:addOrEdit/:id', taggedBailRoutes.days)
  post('/:nomsId/tagged-bail/days/:addOrEdit/:id', taggedBailRoutes.submitDays)
  get('/:nomsId/tagged-bail/review/:addOrEdit/:id', taggedBailRoutes.review)
  post('/:nomsId/tagged-bail/review/:addOrEdit/:id', taggedBailRoutes.submitReview)
  get('/:nomsId/tagged-bail/edit/:id', taggedBailRoutes.edit)
  post('/:nomsId/tagged-bail/edit/:id', taggedBailRoutes.submitEdit)

  get('/:nomsId/manual-unused-deductions/days/:addOrEdit', manualUnusedDeductionRoutes.days)
  post('/:nomsId/manual-unused-deductions/days/:addOrEdit', manualUnusedDeductionRoutes.submitDays)
  get('/:nomsId/manual-unused-deductions/:saveOrDelete', manualUnusedDeductionRoutes.review)
  post('/:nomsId/manual-unused-deductions/:saveOrDelete', manualUnusedDeductionRoutes.submitReview)

  get('/:nomsId/special-remission/add', specialRemissionRoutes.add)
  get('/:nomsId/special-remission/view', specialRemissionRoutes.view)
  get('/:nomsId/special-remission/check/:addOrEdit/:id', specialRemissionRoutes.check)
  post('/:nomsId/special-remission/check/:addOrEdit/:id', specialRemissionRoutes.submitCheck)
  get('/:nomsId/special-remission/days/:addOrEdit/:id', specialRemissionRoutes.days)
  post('/:nomsId/special-remission/days/:addOrEdit/:id', specialRemissionRoutes.submitDays)
  get('/:nomsId/special-remission/type/:addOrEdit/:id', specialRemissionRoutes.type)
  post('/:nomsId/special-remission/type/:addOrEdit/:id', specialRemissionRoutes.submitType)
  get('/:nomsId/special-remission/review/:addOrEdit/:id', specialRemissionRoutes.review)
  post('/:nomsId/special-remission/review/:addOrEdit/:id', specialRemissionRoutes.submitReview)
  get('/:nomsId/special-remission/decline/:addOrEdit/:id', specialRemissionRoutes.decline)

  get('/:nomsId/review-deductions', reviewUnusedDeductionRoutes.review)
  post('/:nomsId/review-deductions', reviewUnusedDeductionRoutes.submitReview)
  get('/:nomsId/review-deductions/confirm', reviewUnusedDeductionRoutes.confirm)
  post('/:nomsId/review-deductions/confirm', reviewUnusedDeductionRoutes.submitConfirm)

  get('/:nomsId/:adjustmentTypeUrl/view', adjustmentRoutes.view)
  get('/:nomsId/:adjustmentTypeUrl/remove/:id', adjustmentRoutes.remove)
  post('/:nomsId/:adjustmentTypeUrl/remove/:id', adjustmentRoutes.submitRemove)
  get('/:nomsId/:adjustmentTypeUrl/:addOrEdit', adjustmentRoutes.form)
  post('/:nomsId/:adjustmentTypeUrl/:addOrEdit', adjustmentRoutes.submitForm)
  get('/:nomsId/:adjustmentTypeUrl/:addOrEdit/:id', adjustmentRoutes.form)
  post('/:nomsId/:adjustmentTypeUrl/:addOrEdit/:id', adjustmentRoutes.submitForm)

  get('/:nomsId/recall', adjustmentRoutes.recall)
  post('/:nomsId/recall', adjustmentRoutes.recallSubmit)

  get('/:nomsId/remand', adjustmentRoutes.remand)
  return router
}

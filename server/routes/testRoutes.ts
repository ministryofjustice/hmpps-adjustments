import { RequestHandler } from 'express'
import AdjustmentForm from '../model/adjustmentForm'
import adjustmentTypes from '../model/adjustmentTypes'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'

export default class AdjustmentTestRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
  ) {}

  public list: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)

    return res.render('pages/test/minimal-list', {
      model: {
        prisonerDetail,
        adjustments,
      },
    })
  }

  public create: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    return res.render('pages/test/form', {
      model: {
        prisonerDetail,
        adjustmentTypes,
        adjustment: new AdjustmentForm({}),
      },
    })
  }

  public update: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = await this.adjustmentsService.get(adjustmentId, token)

    return res.render('pages/test/form', {
      model: {
        prisonerDetail,
        adjustmentTypes,
        adjustment: AdjustmentForm.fromAdjustment(adjustment),
      },
    })
  }

  public submitAdjustment: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new AdjustmentForm(req.body)
    const adjustment = adjustmentForm.toAdjustmentDetails(prisonerDetail.bookingId, nomsId)

    if (adjustmentId) {
      await this.adjustmentsService.update(adjustmentId, adjustment, token)
    } else {
      await this.adjustmentsService.create(adjustment, token)
    }

    return res.redirect(`/test/${nomsId}`)
  }

  public deleteAdjustment: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId, adjustmentId } = req.params

    await this.adjustmentsService.delete(adjustmentId, token)
    return res.redirect(`/test/${nomsId}`)
  }
}

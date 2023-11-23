import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import FullPageError from '../model/FullPageError'
import RemandDatesForm from '../model/remandDatesForm'
import RemandOffencesForm from '../model/remandOffencesForm'
import RemandSelectOffencesModel from '../model/remandSelectOffencesModel'

export default class RemandRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
  ) {}

  public add: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetails = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const sessionId = this.adjustmentsStoreService.store(req, nomsId, null, {
      adjustmentType: 'REMAND',
      bookingId: prisonerDetails.bookingId,
      person: nomsId,
      prisonId: prisonerDetails.agencyId,
    })
    return res.redirect(`/${nomsId}/remand/dates/add/${sessionId}`)
  }

  public dates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    const form = RemandDatesForm.fromAdjustment(adjustment)

    return res.render('pages/adjustments/remand/dates', {
      model: { prisonerDetail, form, addOrEdit, id },
    })
  }

  public submitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new RemandDatesForm(req.body)

    await adjustmentForm.validate(() => this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token))

    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/remand/dates', {
        model: { prisonerDetail, form: adjustmentForm, addOrEdit, id },
      })
    }

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    return res.redirect(`/${nomsId}/remand/offences/${addOrEdit}/${id}`)
  }

  public offences: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
    const form = RemandOffencesForm.fromAdjustment(adjustment)

    return res.render('pages/adjustments/remand/offences', {
      model: new RemandSelectOffencesModel(id, prisonerDetail, adjustment, form, sentencesAndOffences),
    })
  }

  public submitOffences: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new RemandOffencesForm(req.body)

    await adjustmentForm.validate()
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)

    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/remand/offences', {
        model: new RemandSelectOffencesModel(id, prisonerDetail, adjustment, adjustmentForm, sentencesAndOffences),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    return res.redirect(`/${nomsId}/remand/review`)
  }
}

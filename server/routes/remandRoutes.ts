import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import FullPageError from '../model/FullPageError'
import RemandDatesForm from '../model/remandDatesForm'
import RemandOffencesForm from '../model/remandOffencesForm'
import RemandSelectOffencesModel from '../model/remandSelectOffencesModel'
import RemandReviewModel from '../model/remandReviewModel'
import ReviewRemandForm from '../model/reviewRemandForm'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import RemandSaveModel from '../model/remandSaveModel'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import { daysBetween } from '../utils/utils'
import { Message } from '../model/adjustmentsHubViewModel'
import RemandDatesModel from '../model/remandDatesModel'

export default class RemandRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
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
    const adjustments = Object.values(this.adjustmentsStoreService.getAll(req, nomsId))

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    const form = RemandDatesForm.fromAdjustment(adjustment)

    return res.render('pages/adjustments/remand/dates', {
      model: new RemandDatesModel(id, prisonerDetail, adjustments, form),
    })
  }

  public submitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new RemandDatesForm(req.body)

    await adjustmentForm.validate(() => this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token))

    if (adjustmentForm.errors.length) {
      const adjustments = Object.values(this.adjustmentsStoreService.getAll(req, nomsId))
      return res.render('pages/adjustments/remand/dates', {
        model: new RemandDatesModel(id, prisonerDetail, adjustments, adjustmentForm),
      })
    }

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    if (adjustment.complete) {
      return res.redirect(`/${nomsId}/remand/review`)
    }
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

    if (adjustmentForm.errors.length) {
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
      return res.render('pages/adjustments/remand/offences', {
        model: new RemandSelectOffencesModel(id, prisonerDetail, adjustment, adjustmentForm, sentencesAndOffences),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    return res.redirect(`/${nomsId}/remand/review`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const adjustments = this.adjustmentsStoreService.getAll(req, nomsId)
    Object.keys(adjustments).forEach(it => {
      if (!adjustments[it].complete) {
        this.adjustmentsStoreService.remove(req, nomsId, it)
        delete adjustments[it]
      }
    })
    if (!Object.keys(adjustments).length) {
      return res.redirect(`/${nomsId}`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)

    return res.render('pages/adjustments/remand/review', {
      model: new RemandReviewModel(prisonerDetail, adjustments, sentencesAndOffences, new ReviewRemandForm({})),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const form = new ReviewRemandForm(req.body)
    await form.validate()
    if (form.errors.length) {
      const adjustments = this.adjustmentsStoreService.getAll(req, nomsId)
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
      return res.render('pages/adjustments/remand/review', {
        model: new RemandReviewModel(prisonerDetail, adjustments, sentencesAndOffences, form),
      })
    }
    if (form.another === 'yes') {
      return res.redirect(`/${nomsId}/remand/add`)
    }
    return res.redirect(`/${nomsId}/remand/save`)
  }

  public save: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const sessionadjustments = this.adjustmentsStoreService.getAll(req, nomsId)
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)

    let unusedDeductions = 0
    try {
      unusedDeductions = (
        await this.calculateReleaseDatesService.calculateUnusedDeductions(
          nomsId,
          [...this.makeSessionAdjustmentsReadyForCalculation(sessionadjustments), ...adjustments],
          token,
        )
      ).unusedDeductions
    } catch {
      // If CRDS can't calculate unused deductions. There may be a validation error, or some NOMIS deductions.
    }

    return res.render('pages/adjustments/remand/save', {
      model: new RemandSaveModel(prisonerDetail, Object.values(sessionadjustments), unusedDeductions),
    })
  }

  public submitSave: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params

    const adjustments = Object.values(this.adjustmentsStoreService.getAll(req, nomsId))

    await Promise.all(adjustments.map(it => this.adjustmentsService.create(it, token)))

    const message = {
      action: 'REMAND_UPDATED',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public removeFromSession: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, id } = req.params
    this.adjustmentsStoreService.remove(req, nomsId, id)
    return res.redirect(`/${nomsId}/remand/review`)
  }

  private makeSessionAdjustmentsReadyForCalculation(sessionadjustments: { string?: Adjustment }): Adjustment[] {
    return Object.values(sessionadjustments).map(it => {
      return {
        ...it,
        daysBetween: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
      }
    })
  }
}

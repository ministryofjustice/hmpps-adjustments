import { RequestHandler } from 'express'
import { randomUUID } from 'crypto'
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
import {
  daysBetween,
  hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays,
  offencesForRemandAdjustment,
} from '../utils/utils'
import { Message } from '../model/adjustmentsHubViewModel'
import RemandDatesModel from '../model/remandDatesModel'
import RemandViewModel from '../model/remandViewModel'
import RemandChangeModel from '../model/remandChangeModel'
import ParamStoreService from '../services/paramStoreService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'

export default class RemandRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly paramStoreService: ParamStoreService,
  ) {}

  public add: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const { bookingId, prisonId } = res.locals.prisoner
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )

    if (!sentencesAndOffences.length) {
      return res.redirect(`/${nomsId}/remand/no-applicable-sentences`)
    }

    const reviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    const reqId = reviewDeductions ? randomUUID() : null
    if (reviewDeductions) {
      this.paramStoreService.store(req, reqId, true)
    }

    const sessionId = this.adjustmentsStoreService.store(req, nomsId, reqId, {
      id: reqId,
      adjustmentType: 'REMAND',
      bookingId: parseInt(bookingId, 10),
      person: nomsId,
      prisonId,
    })
    return res.redirect(`/${nomsId}/remand/dates/add/${sessionId}`)
  }

  public dates: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { prisonerNumber } = res.locals.prisoner

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }
    const adjustments = Object.values(this.adjustmentsStoreService.getAll(req, nomsId))

    const form = RemandDatesForm.fromAdjustment(adjustment)

    return res.render('pages/adjustments/remand/dates', {
      model: new RemandDatesModel(id, prisonerNumber, adjustments, form, addOrEdit),
    })
  }

  public submitDates: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const adjustmentForm = new RemandDatesForm({ ...req.body, isEdit: addOrEdit === 'edit', adjustmentId: id })

    await adjustmentForm.validate(
      () => this.prisonerService.getSentencesAndOffencesFilteredForRemand(bookingId, username),
      () => this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username),
    )

    const sessionAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/remand/dates', {
        model: new RemandDatesModel(id, prisonerNumber, [sessionAdjustment], adjustmentForm, addOrEdit),
      })
    }

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))
    if (addOrEdit === 'edit') {
      return res.redirect(`/${nomsId}/remand/edit/${id}`)
    }

    if (adjustment.complete) {
      const returnToReviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
      if (returnToReviewDeductions) {
        return res.redirect(`/${nomsId}/unused-deductions/review-deductions`)
      }
      return res.redirect(`/${nomsId}/remand/review`)
    }
    return res.redirect(`/${nomsId}/remand/offences/${addOrEdit}/${id}`)
  }

  public offences: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )
    const form = RemandOffencesForm.fromAdjustment(adjustment, sentencesAndOffences)

    return res.render('pages/adjustments/remand/offences', {
      model: new RemandSelectOffencesModel(id, prisonerNumber, adjustment, form, sentencesAndOffences, addOrEdit),
    })
  }

  public submitOffences: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }

    const adjustmentForm = new RemandOffencesForm(req.body)

    await adjustmentForm.validate()
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (adjustmentForm.errors.length) {
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        bookingId,
        username,
      )
      return res.render('pages/adjustments/remand/offences', {
        model: new RemandSelectOffencesModel(
          id,
          prisonerNumber,
          adjustment,
          adjustmentForm,
          sentencesAndOffences,
          addOrEdit,
        ),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    if (addOrEdit === 'edit') {
      return res.redirect(`/${nomsId}/remand/edit/${id}`)
    }

    const returnToReviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (returnToReviewDeductions) {
      return res.redirect(`/${nomsId}/unused-deductions/review-deductions`)
    }

    return res.redirect(`/${nomsId}/remand/review`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner

    const sessionAdjustments = this.adjustmentsStoreService.getAll(req, nomsId)
    Object.keys(sessionAdjustments).forEach(it => {
      if (!sessionAdjustments[it].complete) {
        this.adjustmentsStoreService.remove(req, nomsId, it)
        delete sessionAdjustments[it]
      }
    })
    if (!Object.keys(sessionAdjustments).length) {
      return res.redirect(`/${nomsId}`)
    }
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )
    const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)
    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      sessionAdjustments,
      adjustments,
      sentencesAndOffences,
      nomsId,
      username,
    )

    return res.render('pages/adjustments/remand/review', {
      model: new RemandReviewModel(
        prisonerNumber,
        sessionAdjustments,
        sentencesAndOffences,
        unusedDeductions?.validationMessages || [],
        new ReviewRemandForm({}),
      ),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner

    const form = new ReviewRemandForm(req.body)
    await form.validate()
    if (form.errors.length) {
      const sessionAdjustments = this.adjustmentsStoreService.getAll(req, nomsId)
      const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        bookingId,
        username,
      )
      const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
        sessionAdjustments,
        adjustments,
        sentencesAndOffences,
        nomsId,
        username,
      )
      return res.render('pages/adjustments/remand/review', {
        model: new RemandReviewModel(
          prisonerNumber,
          sessionAdjustments,
          sentencesAndOffences,
          unusedDeductions?.validationMessages || [],
          form,
        ),
      })
    }
    if (form.another === 'yes') {
      return res.redirect(`/${nomsId}/remand/add`)
    }
    return res.redirect(`/${nomsId}/remand/save`)
  }

  public save: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const { bookingId } = res.locals.prisoner
    const sessionAdjustments = this.adjustmentsStoreService.getAll(req, nomsId)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )

    const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)
    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      sessionAdjustments,
      adjustments,
      sentencesAndOffences,
      nomsId,
      username,
    )

    return res.render('pages/adjustments/remand/save', {
      model: new RemandSaveModel(Object.values(sessionAdjustments), unusedDeductions?.unusedDeductions),
    })
  }

  public submitSave: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const adjustments = Object.values(this.adjustmentsStoreService.getAll(req, nomsId))

    await this.adjustmentsService.create(adjustments, username)

    const days = adjustments.reduce(
      (sum, current) => sum + daysBetween(new Date(current.fromDate), new Date(current.toDate)),
      0,
    )

    const message = {
      type: 'REMAND',
      action: 'CREATE',
      days,
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public removeFromSession: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, id } = req.params
    this.adjustmentsStoreService.remove(req, nomsId, id)
    return res.redirect(`/${nomsId}/remand/review`)
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner
    const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )
    this.adjustmentsStoreService.clear(req, nomsId)
    return res.render('pages/adjustments/remand/view', {
      model: new RemandViewModel(
        adjustments.filter(it => it.adjustmentType === 'REMAND'),
        sentencesAndOffences,
      ),
    })
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params
    const { bookingId } = res.locals.prisoner

    let adjustment
    if (this.paramStoreService.get(req, id)) {
      adjustment = this.adjustmentsStoreService.getById(req, nomsId, id) as Adjustment
    } else {
      adjustment = await this.adjustmentsService.get(id, username)
    }

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )

    const adjustments = await this.adjustmentsService.getAdjustmentsExceptOneBeingEdited(
      { [id]: adjustment },
      nomsId,
      username,
    )

    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      {},
      adjustments,
      sentencesAndOffences,
      nomsId,
      username,
    )

    const showUnusedMessage = hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays(
      adjustments,
      unusedDeductions,
    )

    return res.render('pages/adjustments/remand/remove', {
      model: new RemandChangeModel(adjustment, null, sentencesAndOffences, unusedDeductions, showUnusedMessage),
    })
  }

  public edit: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params
    const { bookingId } = res.locals.prisoner
    let dbAdjustment
    if (this.paramStoreService.get(req, id)) {
      dbAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    } else {
      dbAdjustment = await this.adjustmentsService.get(id, username)
    }

    const sessionAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id) || dbAdjustment
    this.adjustmentsStoreService.store(req, nomsId, id, sessionAdjustment)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )
    const adjustments = await this.adjustmentsService.getAdjustmentsExceptOneBeingEdited(
      { [id]: sessionAdjustment },
      nomsId,
      username,
    )

    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      { [id]: sessionAdjustment },
      adjustments,
      sentencesAndOffences,
      nomsId,
      username,
    )

    const showUnusedMessage = hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays(
      adjustments,
      unusedDeductions,
    )

    const days =
      !sessionAdjustment.fromDate && !sessionAdjustment.toDate
        ? sessionAdjustment.days
        : daysBetween(new Date(sessionAdjustment.fromDate), new Date(sessionAdjustment.toDate))

    return res.render('pages/adjustments/remand/edit', {
      model: new RemandChangeModel(
        {
          ...sessionAdjustment,
          days,
        },
        dbAdjustment,
        sentencesAndOffences,
        unusedDeductions,
        showUnusedMessage,
        this.paramStoreService.get(req, 'returnToReviewDeductions'),
      ),
    })
  }

  public submitEdit: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params
    const { bookingId } = res.locals.prisoner

    const returnToReviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (returnToReviewDeductions) {
      return res.redirect(`/${nomsId}/unused-deductions/review-deductions`)
    }

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (!adjustment.remand?.chargeId?.length) {
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        bookingId,
        username,
      )
      adjustment.remand = {
        chargeId: offencesForRemandAdjustment(adjustment, sentencesAndOffences).map(it => it.offenderChargeId),
      }
    }

    await this.adjustmentsService.update(id, adjustment, username)

    const message = {
      type: 'REMAND',
      action: 'UPDATE',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public noApplicableSentences: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/adjustments/remand/no-applicable-sentence')
  }
}

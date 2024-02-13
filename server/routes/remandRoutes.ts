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
import { daysBetween, hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays } from '../utils/utils'
import { Message } from '../model/adjustmentsHubViewModel'
import RemandDatesModel from '../model/remandDatesModel'
import RemandViewModel from '../model/remandViewModel'
import RemandChangeModel from '../model/remandChangeModel'

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
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      prisonerDetails.bookingId,
      token,
    )

    if (!sentencesAndOffences.length) {
      return res.redirect(`/${nomsId}/remand/no-applicable-sentences`)
    }

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
      model: new RemandDatesModel(id, prisonerDetail, adjustments, form, addOrEdit),
    })
  }

  public submitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new RemandDatesForm({ ...req.body, isEdit: addOrEdit === 'edit', adjustmentId: id })

    await adjustmentForm.validate(
      () => this.prisonerService.getSentencesAndOffencesFilteredForRemand(prisonerDetail.bookingId, token),
      () => this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token),
    )

    const sessionAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/remand/dates', {
        model: new RemandDatesModel(id, prisonerDetail, [sessionAdjustment], adjustmentForm, addOrEdit),
      })
    }

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))
    if (addOrEdit === 'edit') {
      return res.redirect(`/${nomsId}/remand/edit/${id}`)
    }

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
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      prisonerDetail.bookingId,
      token,
    )
    const form = RemandOffencesForm.fromAdjustment(adjustment, sentencesAndOffences)

    return res.render('pages/adjustments/remand/offences', {
      model: new RemandSelectOffencesModel(id, prisonerDetail, adjustment, form, sentencesAndOffences, addOrEdit),
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
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        prisonerDetail.bookingId,
        token,
      )
      return res.render('pages/adjustments/remand/offences', {
        model: new RemandSelectOffencesModel(
          id,
          prisonerDetail,
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

    return res.redirect(`/${nomsId}/remand/review`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

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
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      prisonerDetail.bookingId,
      token,
    )
    const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)
    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      sessionAdjustments,
      adjustments,
      sentencesAndOffences,
      nomsId,
      token,
    )

    return res.render('pages/adjustments/remand/review', {
      model: new RemandReviewModel(
        prisonerDetail,
        sessionAdjustments,
        sentencesAndOffences,
        unusedDeductions?.validationMessages || [],
        new ReviewRemandForm({}),
      ),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const form = new ReviewRemandForm(req.body)
    await form.validate()
    if (form.errors.length) {
      const sessionAdjustments = this.adjustmentsStoreService.getAll(req, nomsId)
      const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        prisonerDetail.bookingId,
        token,
      )
      const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
        sessionAdjustments,
        adjustments,
        sentencesAndOffences,
        nomsId,
        token,
      )
      return res.render('pages/adjustments/remand/review', {
        model: new RemandReviewModel(
          prisonerDetail,
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
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const sessionAdjustments = this.adjustmentsStoreService.getAll(req, nomsId)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      prisonerDetail.bookingId,
      token,
    )

    const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)
    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      sessionAdjustments,
      adjustments,
      sentencesAndOffences,
      nomsId,
      token,
    )

    return res.render('pages/adjustments/remand/save', {
      model: new RemandSaveModel(prisonerDetail, Object.values(sessionAdjustments), unusedDeductions?.unusedDeductions),
    })
  }

  public submitSave: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params

    const adjustments = Object.values(this.adjustmentsStoreService.getAll(req, nomsId))

    await this.adjustmentsService.create(adjustments, token)

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

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, token } = res.locals.user
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustments = (await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, token)).filter(
      it => it.adjustmentType === 'REMAND',
    )
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      prisonerDetail.bookingId,
      token,
    )
    this.adjustmentsStoreService.clear(req, nomsId)

    return res.render('pages/adjustments/remand/view', {
      model: new RemandViewModel(prisonerDetail, adjustments, sentencesAndOffences),
    })
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = await this.adjustmentsService.get(id, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      prisonerDetail.bookingId,
      token,
    )

    const adjustments = await this.adjustmentsService.getAdjustmentsExceptOneBeingEdited(
      { [id]: adjustment },
      nomsId,
      token,
    )

    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      {},
      adjustments,
      sentencesAndOffences,
      nomsId,
      token,
    )

    const showUnusedMessage = hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays(
      adjustments,
      unusedDeductions,
    )

    return res.render('pages/adjustments/remand/remove', {
      model: new RemandChangeModel(
        prisonerDetail,
        adjustment,
        sentencesAndOffences,
        unusedDeductions,
        showUnusedMessage,
      ),
    })
  }

  public edit: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    let sessionAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    sessionAdjustment = sessionAdjustment || (await this.adjustmentsService.get(id, token))
    this.adjustmentsStoreService.store(req, nomsId, id, sessionAdjustment)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      prisonerDetail.bookingId,
      token,
    )
    const adjustments = await this.adjustmentsService.getAdjustmentsExceptOneBeingEdited(
      { [id]: sessionAdjustment },
      nomsId,
      token,
    )

    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      { [id]: sessionAdjustment },
      adjustments,
      sentencesAndOffences,
      nomsId,
      token,
    )

    const showUnusedMessage = hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays(
      adjustments,
      unusedDeductions,
    )

    return res.render('pages/adjustments/remand/edit', {
      model: new RemandChangeModel(
        prisonerDetail,
        {
          ...sessionAdjustment,
          daysBetween: daysBetween(new Date(sessionAdjustment.fromDate), new Date(sessionAdjustment.toDate)),
        },
        sentencesAndOffences,
        unusedDeductions,
        showUnusedMessage,
      ),
    })
  }

  public submitEdit: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId, id } = req.params

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    await this.adjustmentsService.update(id, adjustment, token)

    const message = {
      action: 'REMAND_UPDATED',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public noApplicableSentences: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    return res.render('pages/adjustments/remand/no-applicable-sentence', {
      model: {
        prisonerDetail,
      },
    })
  }
}

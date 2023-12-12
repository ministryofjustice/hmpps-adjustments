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
import { UnusedDeductionCalculationResponse } from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'
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
    const unusedDeductions = await this.unusedDeductionsHandlingCRDError(
      adjustments,
      sentencesAndOffences,
      nomsId,
      token,
    )

    return res.render('pages/adjustments/remand/review', {
      model: new RemandReviewModel(
        prisonerDetail,
        adjustments,
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
      const adjustments = this.adjustmentsStoreService.getAll(req, nomsId)
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
      const unusedDeductions = await this.unusedDeductionsHandlingCRDError(
        adjustments,
        sentencesAndOffences,
        nomsId,
        token,
      )
      return res.render('pages/adjustments/remand/review', {
        model: new RemandReviewModel(
          prisonerDetail,
          adjustments,
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
    const adjustments = this.adjustmentsStoreService.getAll(req, nomsId)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
    const unusedDeductions = await this.unusedDeductionsHandlingCRDError(
      adjustments,
      sentencesAndOffences,
      nomsId,
      token,
    )

    return res.render('pages/adjustments/remand/save', {
      model: new RemandSaveModel(prisonerDetail, Object.values(adjustments), unusedDeductions?.unusedDeductions),
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

  private makeSessionAdjustmentsReadyForCalculation(
    sessionadjustments: { string?: Adjustment },
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences[],
  ): Adjustment[] {
    return Object.values(sessionadjustments).map(it => {
      const sentence = sentencesAndOffence.find(sent =>
        sent.offences.some(off => it.remand.chargeId.includes(off.offenderChargeId)),
      )
      return {
        ...it,
        daysBetween: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
        effectiveDays: daysBetween(new Date(it.fromDate), new Date(it.toDate)),
        sentenceSequence: sentence.sentenceSequence,
      }
    })
  }

  private async unusedDeductionsHandlingCRDError(
    sessionadjustments: { string?: Adjustment },
    sentencesAndOffence: PrisonApiOffenderSentenceAndOffences[],
    nomsId: string,
    token: string,
  ): Promise<UnusedDeductionCalculationResponse> {
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)

    try {
      return await this.calculateReleaseDatesService.calculateUnusedDeductions(
        nomsId,
        [...this.makeSessionAdjustmentsReadyForCalculation(sessionadjustments, sentencesAndOffence), ...adjustments],
        token,
      )
    } catch {
      // If CRDS can't calculate unused deductions. There may be a validation error, or some NOMIS deductions.
      return null
    }
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { caseloads, token } = res.locals.user
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustments = (await this.adjustmentsService.findByPerson(nomsId, token)).filter(
      it => it.adjustmentType === 'REMAND',
    )
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)

    // TODO copied this code in from the generic View route - need to double check what it's used for WIP
    // Can be removed from the generic route once done
    // const remandDecision =
    //     adjustmentType.value === 'REMAND' && roles.includes('REMAND_IDENTIFIER')
    //         ? await this.identifyRemandPeriodsService.getRemandDecision(nomsId, token)
    //         : null
    return res.render('pages/adjustments/remand/view', {
      model: new RemandViewModel(prisonerDetail, adjustments, sentencesAndOffences),
    })
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = await this.adjustmentsService.get(id, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
    return res.render('pages/adjustments/remand/remove', {
      model: new RemandChangeModel(prisonerDetail, adjustment, sentencesAndOffences),
    })
  }

  public edit: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = await this.adjustmentsService.get(id, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
    return res.render('pages/adjustments/remand/edit', {
      model: new RemandChangeModel(prisonerDetail, adjustment, sentencesAndOffences),
    })
  }
}

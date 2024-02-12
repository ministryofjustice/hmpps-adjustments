import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import TaggedBailSelectCaseModel from '../model/taggedBailSelectCaseModel'
import TaggedBailDaysModel from '../model/taggedBailDaysModel'
import TaggedBailDaysForm from '../model/taggedBailDaysForm'
import TaggedBailReviewModel from '../model/taggedBailReviewModel'
import { Message } from '../model/adjustmentsHubViewModel'
import adjustmentTypes from '../model/adjustmentTypes'
import TaggedBailViewModel from '../model/taggedBailViewModel'
import TaggedBailRemoveModel from '../model/taggedBailRemoveModel'
import {
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays,
} from '../utils/utils'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

export default class TaggedBailRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly calculateReleaseDateService: CalculateReleaseDatesService,
  ) {}

  public add: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    const sessionId = this.adjustmentsStoreService.store(req, nomsId, null, {
      adjustmentType: 'TAGGED_BAIL',
      bookingId: prisonerDetail.bookingId,
      person: nomsId,
      prisonId: prisonerDetail.agencyId,
    })

    return res.redirect(`/${nomsId}/tagged-bail/select-case/add/${sessionId}`)
  }

  public selectCase: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    return res.render('pages/adjustments/tagged-bail/select-case', {
      model: new TaggedBailSelectCaseModel(prisonerDetail, sentencesAndOffences, addOrEdit, id, adjustment),
    })
  }

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { caseSequence } = req.query as Record<string, string>
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (caseSequence) {
      this.adjustmentsStoreService.store(req, nomsId, id, {
        ...adjustment,
        taggedBail: { caseSequence: Number(caseSequence) },
      })
    }
    const form = TaggedBailDaysForm.fromAdjustment(adjustment)

    return res.render('pages/adjustments/tagged-bail/days', {
      model: new TaggedBailDaysModel(prisonerDetail, addOrEdit, id, form, adjustment),
    })
  }

  public submitDays: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new TaggedBailDaysForm({ ...req.body, isEdit: addOrEdit === 'edit', adjustmentId: id })
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    await adjustmentForm.validate()
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/tagged-bail/days', {
        model: new TaggedBailDaysModel(prisonerDetail, addOrEdit, id, adjustmentForm, adjustment),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))
    return res.redirect(`/${nomsId}/tagged-bail/review/${addOrEdit}/${id}`)
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)
    const taggedBailAdjustments = adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL')
    if (!taggedBailAdjustments.length) {
      return res.redirect(`/${nomsId}`)
    }

    const adjustmentType = adjustmentTypes.find(it => it.url === 'tagged-bail')
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)

    return res.render('pages/adjustments/tagged-bail/view', {
      model: new TaggedBailViewModel(prisonerDetail, taggedBailAdjustments, adjustmentType, sentencesAndOffences),
    })
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = await this.adjustmentsService.get(id, token)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    const adjustmentType = adjustmentTypes.find(it => it.url === 'tagged-bail')
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)
    const sentencesByCaseSequence = getActiveSentencesByCaseSequence(sentencesAndOffences)
    const sentencesForCaseSequence = sentencesByCaseSequence.find(
      it => it.caseSequence === adjustment.taggedBail.caseSequence,
    )
    const sentenceAndOffence = getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences)

    const sessionAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const adjustments = await this.adjustmentsService.getAdjustmentsExceptOneBeingEdited(
      { [id]: sessionAdjustment },
      nomsId,
      token,
    )

    const unusedDeductions = await this.calculateReleaseDateService.unusedDeductionsHandlingCRDError(
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

    return res.render('pages/adjustments/tagged-bail/remove', {
      model: new TaggedBailRemoveModel(
        prisonerDetail,
        adjustment,
        adjustmentType,
        sentenceAndOffence,
        showUnusedMessage,
      ),
    })
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { caseSequence } = req.query as Record<string, string>
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    if (caseSequence) {
      this.adjustmentsStoreService.store(req, nomsId, id, {
        ...this.adjustmentsStoreService.getById(req, nomsId, id),
        taggedBail: { caseSequence: Number(caseSequence) },
      })
    }
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)

    return res.render('pages/adjustments/tagged-bail/review', {
      model: new TaggedBailReviewModel(prisonerDetail, addOrEdit, id, sentencesAndOffences, adjustment),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId, id } = req.params

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    await this.adjustmentsService.create([adjustment], token)

    const message = {
      action: 'TAGGED_BAIL_UPDATED',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }
}

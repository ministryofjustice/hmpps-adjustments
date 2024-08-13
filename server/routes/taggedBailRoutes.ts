import { RequestHandler } from 'express'
import { randomUUID } from 'crypto'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import TaggedBailSelectCaseModel from '../model/taggedBailSelectCaseModel'
import TaggedBailDaysModel from '../model/taggedBailDaysModel'
import TaggedBailDaysForm from '../model/taggedBailDaysForm'
import TaggedBailReviewModel from '../model/taggedBailReviewModel'
import { Message } from '../model/adjustmentsHubViewModel'
import TaggedBailViewModel from '../model/taggedBailViewModel'
import {
  getActiveSentencesByCaseSequence,
  getMostRecentSentenceAndOffence,
  hasCalculatedUnusedDeductionDaysChangedFromUnusedDeductionAdjustmentDays,
  relevantSentenceForTaggedBailAdjustment,
} from '../utils/utils'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import TaggedBailChangeModel from '../model/taggedBailEditModel'
import TaggedBailRemoveModel from '../model/taggedBailRemoveModel'
import ParamStoreService from '../services/paramStoreService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import UnusedDeductionsService from '../services/unusedDeductionsService'
import config from '../config'

export default class TaggedBailRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly paramStoreService: ParamStoreService,
    private readonly unusedDeductionsService: UnusedDeductionsService,
  ) {}

  public add: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { bookingId, prisonId } = res.locals.prisoner
    const reviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    const reqId = reviewDeductions ? randomUUID() : null
    if (reviewDeductions) {
      this.paramStoreService.store(req, reqId, true)
    }

    const sessionId = this.adjustmentsStoreService.store(req, nomsId, reqId, {
      id: reqId,
      adjustmentType: 'TAGGED_BAIL',
      bookingId: parseInt(bookingId, 10),
      person: nomsId,
      prisonId,
    })

    return res.redirect(`/${nomsId}/tagged-bail/select-case/add/${sessionId}`)
  }

  public selectCase: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/tagged-bail/select-case', {
      model: new TaggedBailSelectCaseModel(prisonerNumber, sentencesAndOffences, addOrEdit, id, adjustment),
    })
  }

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { caseSequence } = req.query as Record<string, string>
    const { prisonerNumber } = res.locals.prisoner
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }
    if (caseSequence) {
      this.adjustmentsStoreService.store(req, nomsId, id, {
        ...adjustment,
        taggedBail: { caseSequence: Number(caseSequence) },
      })
    }
    const form = TaggedBailDaysForm.fromAdjustment(adjustment)

    return res.render('pages/adjustments/tagged-bail/days', {
      model: new TaggedBailDaysModel(prisonerNumber, addOrEdit, id, form, adjustment),
    })
  }

  public submitDays: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const adjustmentForm = new TaggedBailDaysForm({ ...req.body, isEdit: addOrEdit === 'edit', adjustmentId: id })
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    await adjustmentForm.validate()
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/tagged-bail/days', {
        model: new TaggedBailDaysModel(prisonerNumber, addOrEdit, id, adjustmentForm, adjustment),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))
    const returnToReviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (returnToReviewDeductions) {
      return res.redirect(`/${nomsId}/unused-deductions/review-deductions`)
    }

    if (addOrEdit === 'edit') {
      return res.redirect(`/${nomsId}/tagged-bail/${addOrEdit}/${id}`)
    }
    return res.redirect(`/${nomsId}/tagged-bail/review/${addOrEdit}/${id}`)
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)
    const taggedBailAdjustments = adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL')
    if (!taggedBailAdjustments.length) {
      return res.redirect(`/${nomsId}`)
    }

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)

    const unusedDeductionType = await this.unusedDeductionsService.getCalculatedUnusedDeductionsMessage(
      nomsId,
      bookingId,
      false,
      username,
    )

    let unusedDeductionMessage = null
    if (unusedDeductionType === 'NOMIS_ADJUSTMENT' && config.featureToggles.reviewUnusedDeductions) {
      const nomisAdjustments = adjustments.filter(it => it.source === 'NOMIS')
      const hasTaggedBail = nomisAdjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL').length > 0
      const hasRemand = nomisAdjustments.filter(it => it.adjustmentType === 'REMAND').length > 0
      const hasUnusedRemand = nomisAdjustments.filter(it => it.adjustmentType === 'UNUSED_DEDUCTIONS').length > 0
      let reviewMessage: string
      if (hasRemand && hasTaggedBail) {
        reviewMessage = 'review remand and tagged bail to calculate'
      } else if (hasRemand) {
        reviewMessage = 'review remand to calculate'
      } else if (hasTaggedBail) {
        reviewMessage = 'review tagged bail to calculate'
      }

      unusedDeductionMessage = `Unused deductions have not been calculated${hasUnusedRemand ? ' as there are deductions in NOMIS' : ''} - <a href="/${nomsId}/unused-deductions/review-deductions">${reviewMessage}</a>`
    }

    return res.render('pages/adjustments/tagged-bail/view', {
      model: new TaggedBailViewModel(
        prisonerNumber,
        taggedBailAdjustments,
        sentencesAndOffences,
        unusedDeductionMessage,
      ),
    })
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner

    if (this.paramStoreService.get(req, id)) {
      this.adjustmentsStoreService.remove(req, nomsId, id)
      return res.redirect(`/${nomsId}/unused-deductions/review-deductions`)
    }

    const adjustment = await this.adjustmentsService.get(id, username)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)
    const sentencesByCaseSequence = getActiveSentencesByCaseSequence(sentencesAndOffences)
    const sentencesForCaseSequence = sentencesByCaseSequence.find(it =>
      relevantSentenceForTaggedBailAdjustment(it, adjustment),
    )

    const sentenceAndOffence = getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences)

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

    const reviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')

    return res.render('pages/adjustments/tagged-bail/remove', {
      model: new TaggedBailRemoveModel(
        prisonerNumber,
        adjustment,
        sentenceAndOffence,
        showUnusedMessage,
        reviewDeductions,
      ),
    })
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { caseSequence } = req.query as Record<string, string>
    const { bookingId, prisonerNumber } = res.locals.prisoner
    if (caseSequence) {
      this.adjustmentsStoreService.store(req, nomsId, id, {
        ...this.adjustmentsStoreService.getById(req, nomsId, id),
        taggedBail: { caseSequence: Number(caseSequence) },
      })
    }
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const sessionAdjustments = this.adjustmentsStoreService.getAll(req, nomsId)
    const adjustments = await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(nomsId, username)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)

    const unusedDeductions = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      sessionAdjustments,
      adjustments,
      sentencesAndOffences,
      nomsId,
      username,
    )

    return res.render('pages/adjustments/tagged-bail/review', {
      model: new TaggedBailReviewModel(
        prisonerNumber,
        addOrEdit,
        id,
        sentencesAndOffences,
        adjustment,
        !!unusedDeductions?.unusedDeductions,
      ),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    await this.adjustmentsService.create([adjustment], username)

    const message = {
      type: 'TAGGED_BAIL',
      action: 'CREATE',
      days: adjustment.days,
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public edit: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const { caseSequence } = req.query as Record<string, string>
    let sessionAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    sessionAdjustment = sessionAdjustment || (await this.adjustmentsService.get(id, username))
    if (caseSequence) {
      sessionAdjustment = {
        ...sessionAdjustment,
        taggedBail: { caseSequence: Number(caseSequence) },
      }
    }

    this.adjustmentsStoreService.store(req, nomsId, id, sessionAdjustment)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)
    let adjustments: Adjustment[]
    if (this.paramStoreService.get(req, id)) {
      const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
      adjustments = await this.adjustmentsService.findByPerson(
        nomsId,
        startOfSentenceEnvelope.earliestSentence,
        username,
      )
    } else {
      adjustments = await this.adjustmentsService.getAdjustmentsExceptOneBeingEdited(
        { [id]: sessionAdjustment },
        nomsId,
        username,
      )
    }

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

    const sentencesByCaseSequence = getActiveSentencesByCaseSequence(sentencesAndOffences)
    const sentencesForCaseSequence = sentencesByCaseSequence.find(it =>
      relevantSentenceForTaggedBailAdjustment(it, sessionAdjustment),
    )
    const sentenceAndOffence = getMostRecentSentenceAndOffence(sentencesForCaseSequence.sentences)

    return res.render('pages/adjustments/tagged-bail/edit', {
      model: new TaggedBailChangeModel(
        prisonerNumber,
        sessionAdjustment,
        sentenceAndOffence,
        sentencesByCaseSequence.length,
        showUnusedMessage,
        this.paramStoreService.get(req, 'returnToReviewDeductions'),
      ),
    })
  }

  public submitEdit: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params
    const { bookingId } = res.locals.prisoner

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (!adjustment.taggedBail?.caseSequence) {
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        bookingId,
        username,
      )

      const sentencesByCaseSequence = getActiveSentencesByCaseSequence(sentencesAndOffences)
      const sentencesForCaseSequence = sentencesByCaseSequence.find(it =>
        relevantSentenceForTaggedBailAdjustment(it, adjustment),
      )

      adjustment.taggedBail = {
        caseSequence: sentencesForCaseSequence.caseSequence,
      }
    }

    const returnToReviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (returnToReviewDeductions) {
      return res.redirect(`/${nomsId}/unused-deductions/review-deductions`)
    }

    await this.adjustmentsService.update(id, adjustment, username)

    const message = {
      type: 'TAGGED_BAIL',
      action: 'UPDATE',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }
}

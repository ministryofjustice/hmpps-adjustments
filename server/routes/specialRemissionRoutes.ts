import { RequestHandler } from 'express'
import { randomUUID } from 'crypto'
import SpecialRemissionCheckModel from '../model/special-remission/specialRemissionCheckModel'
import SpecialRemissionDeclineModel from '../model/special-remission/specialRemissionDeclineModel'
import SpecialRemissionDaysModel from '../model/special-remission/specialRemissionDaysModel'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import SpecialRemissionDaysForm from '../model/special-remission/specialRemissionDaysForm'
import SpecialRemissionTypeModel from '../model/special-remission/specialRemissionTypeModel'
import SpecialRemissionReviewModel from '../model/special-remission/specialRemissionReviewModel'
import AdjustmentsService from '../services/adjustmentsService'
import { Message } from '../model/adjustmentsHubViewModel'
import SpecialRemissionViewModel from '../model/special-remission/specialRemissionViewModel'
import PrisonerService from '../services/prisonerService'
import { daysBetween } from '../utils/utils'
import SpecialRemissionRemoveModel from '../model/special-remission/specialRemissionRemoveModel'
import { PrisonApiOffenderSentenceAndOffences } from '../@types/prisonApi/prisonClientTypes'

export default class SpecialRemissionRoutes {
  constructor(
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public add: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { bookingId, prisonId } = res.locals.prisoner

    const sessionId = this.adjustmentsStoreService.store(req, nomsId, randomUUID(), {
      adjustmentType: 'SPECIAL_REMISSION',
      bookingId: parseInt(bookingId, 10),
      person: nomsId,
      prisonId,
    })

    return res.redirect(`/${nomsId}/special-remission/check/add/${sessionId}`)
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )

    const specialRemissionAdjustments = adjustments.filter(it => it.adjustmentType === 'SPECIAL_REMISSION')
    if (!specialRemissionAdjustments.length) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/special-remission/view', {
      model: new SpecialRemissionViewModel(prisonerNumber, specialRemissionAdjustments),
    })
  }

  public check: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { username } = res.locals.user

    let sessionAdjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    sessionAdjustment = sessionAdjustment || (await this.adjustmentsService.get(id, username))
    this.adjustmentsStoreService.store(req, nomsId, id, sessionAdjustment)

    return res.render('pages/adjustments/special-remission/check', {
      model: new SpecialRemissionCheckModel(nomsId, id, addOrEdit),
    })
  }

  public submitCheck: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params

    if (!req.body.ppcsDays) {
      return res.render('pages/adjustments/special-remission/check', {
        model: new SpecialRemissionCheckModel(nomsId, id, addOrEdit, true),
      })
    }
    if (req.body.ppcsDays === 'no') {
      return res.redirect(`/${nomsId}/special-remission/decline/${addOrEdit}/${id}`)
    }

    return res.redirect(`/${nomsId}/special-remission/days/${addOrEdit}/${id}`)
  }

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }
    const form = SpecialRemissionDaysForm.fromAdjustment(adjustment)

    return res.render(`pages/adjustments/special-remission/days`, {
      model: new SpecialRemissionDaysModel(nomsId, id, addOrEdit, form, adjustment),
    })
  }

  public submitDays: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const adjustmentForm = new SpecialRemissionDaysForm({ ...req.body, isEdit: false, adjustmentId: id })
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    await adjustmentForm.validate()
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/special-remission/days', {
        model: new SpecialRemissionDaysModel(prisonerNumber, id, addOrEdit, adjustmentForm, adjustment),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    return res.redirect(`/${nomsId}/special-remission/type/${addOrEdit}/${id}`)
  }

  public type: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/special-remission/type', {
      model: new SpecialRemissionTypeModel(nomsId, id, addOrEdit, adjustment),
    })
  }

  public submitType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (!req.body.specialRemissionType) {
      return res.render('pages/adjustments/special-remission/type', {
        model: new SpecialRemissionTypeModel(nomsId, id, addOrEdit, adjustment, true),
      })
    }

    adjustment.specialRemission = { type: req.body.specialRemissionType }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustment)

    return res.redirect(`/${nomsId}/special-remission/review/${addOrEdit}/${id}`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/special-remission/review', {
      model: new SpecialRemissionReviewModel(nomsId, id, addOrEdit, adjustment),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner
    const { nomsId } = req.params

    const adjustment = this.adjustmentsStoreService.getOnly(req, nomsId)
    const fromDate = this.getFromDate(await this.prisonerService.getSentencesAndOffences(bookingId, username))

    adjustment.fromDate = fromDate.toISOString().substring(0, 10)

    if (adjustment) {
      if (adjustment.id) {
        await this.adjustmentsService.update(adjustment.id, adjustment, username)
      } else {
        await this.adjustmentsService.create([adjustment], username)
      }

      const message = {
        type: adjustment.adjustmentType,
        days: adjustment.days || daysBetween(new Date(adjustment.fromDate), new Date(adjustment.toDate)),
        action: adjustment.id ? 'UPDATE' : 'CREATE',
      } as Message
      return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
    }
    return res.redirect(`/${nomsId}`)
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params

    const adjustment = await this.adjustmentsService.get(id, username)
    return res.render('pages/adjustments/special-remission/remove', {
      model: new SpecialRemissionRemoveModel(nomsId, adjustment),
    })
  }

  public submitRemove: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params

    const adjustment = await this.adjustmentsService.get(id, username)

    await this.adjustmentsService.delete(id, username)
    const message = JSON.stringify({
      type: adjustment.adjustmentType,
      days: adjustment.days,
      action: 'REMOVE',
    } as Message)
    return res.redirect(`/${nomsId}/success?message=${message}`)
  }

  public decline: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params

    return res.render('pages/adjustments/special-remission/decline', {
      model: new SpecialRemissionDeclineModel(nomsId, addOrEdit, id),
    })
  }

  private getFromDate(activeSentences: PrisonApiOffenderSentenceAndOffences[]) {
    let fromDate = new Date()
    const sentencesWithSentenceDate = activeSentences.filter(it => it.sentenceDate)

    if (sentencesWithSentenceDate.length) {
      fromDate = new Date(
        sentencesWithSentenceDate.reduce((a, b) =>
          new Date(a.sentenceDate) < new Date(b.sentenceDate) ? a : b,
        ).sentenceDate,
      )
    }
    return fromDate
  }
}

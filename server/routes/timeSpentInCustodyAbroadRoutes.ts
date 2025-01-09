import { RequestHandler } from 'express'
import { randomUUID } from 'crypto'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdjustmentsService from '../services/adjustmentsService'
import PrisonerService from '../services/prisonerService'
import TimeSpentInCustodyAbroadDocumentationModel from '../model/custody-abroad/timeSpentInCustodyAbroadDocumentationModel'
import TimeSpentInCustodyAbroadDaysForm from '../model/custody-abroad/timeSpentInCustodyAbroadDaysForm'
import TimeSpentInCustodyAbroadDaysModel from '../model/custody-abroad/timeSpentInCustodyAbroadDaysModel'
import TimeSpentInCustodyAbroadReviewModel from '../model/custody-abroad/timeSpentInCustodyAbroadReviewModel'
import { Message } from '../model/adjustmentsHubViewModel'
import TimeSpentInCustodyAbroadViewModel from '../model/custody-abroad/timeSpentInCustodyAbroadViewModel'
import TimeSpentInCustodyAbroadRemoveModel from '../model/custody-abroad/timeSpentInCustodyAbroadRemoveModel'

export default class TimeSpentInCustodyAbroadRoutes {
  constructor(
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public add: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { bookingId, prisonId } = res.locals.prisoner

    const sessionId = this.adjustmentsStoreService.store(req, nomsId, randomUUID(), {
      adjustmentType: 'CUSTODY_ABROAD',
      bookingId: parseInt(bookingId, 10),
      person: nomsId,
      prisonId,
    })

    return res.redirect(`/${nomsId}/custody-abroad/documentation/add/${sessionId}`)
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

    const timeSpentInCustodyAbroadAdjustments = adjustments.filter(it => it.adjustmentType === 'CUSTODY_ABROAD')
    if (!timeSpentInCustodyAbroadAdjustments.length) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/custody-abroad/view', {
      model: new TimeSpentInCustodyAbroadViewModel(prisonerNumber, timeSpentInCustodyAbroadAdjustments),
    })
  }

  public documentation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { username } = res.locals.user

    let adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    adjustment = adjustment || (await this.adjustmentsService.get(id, username))
    this.adjustmentsStoreService.store(req, nomsId, id, adjustment)

    return res.render('pages/adjustments/custody-abroad/documentation', {
      model: new TimeSpentInCustodyAbroadDocumentationModel(nomsId, id, addOrEdit, adjustment),
    })
  }

  public submitDocumentation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (!req.body.documentationSource) {
      return res.render('pages/adjustments/custody-abroad/documentation', {
        model: new TimeSpentInCustodyAbroadDocumentationModel(nomsId, id, addOrEdit, adjustment, true),
      })
    }

    adjustment.timeSpentInCustodyAbroad = { documentationSource: req.body.documentationSource }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustment)

    return res.redirect(`/${nomsId}/custody-abroad/days/${addOrEdit}/${id}`)
  }

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }
    const form = TimeSpentInCustodyAbroadDaysForm.fromAdjustment(adjustment)

    return res.render(`pages/adjustments/custody-abroad/days`, {
      model: new TimeSpentInCustodyAbroadDaysModel(nomsId, id, addOrEdit, form, adjustment),
    })
  }

  public submitDays: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const adjustmentForm = new TimeSpentInCustodyAbroadDaysForm({ ...req.body, isEdit: false, adjustmentId: id })
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    await adjustmentForm.validate()
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/custody-abroad/days', {
        model: new TimeSpentInCustodyAbroadDaysModel(prisonerNumber, id, addOrEdit, adjustmentForm, adjustment),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    return res.redirect(`/${nomsId}/custody-abroad/review/${addOrEdit}/${id}`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/custody-abroad/review', {
      model: new TimeSpentInCustodyAbroadReviewModel(nomsId, id, addOrEdit, adjustment),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const adjustment = this.adjustmentsStoreService.getOnly(req, nomsId)

    if (adjustment) {
      if (adjustment.id) {
        await this.adjustmentsService.update(adjustment.id, adjustment, username)
      } else {
        await this.adjustmentsService.create([adjustment], username)
      }

      const message = {
        type: adjustment.adjustmentType,
        days: adjustment.days,
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
    return res.render('pages/adjustments/custody-abroad/remove', {
      model: new TimeSpentInCustodyAbroadRemoveModel(nomsId, adjustment),
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
}

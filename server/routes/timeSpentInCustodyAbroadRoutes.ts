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
import TimeSpentInCustodyAbroadSelectOffencesModel from '../model/custody-abroad/timeSpentInCustodyAbroadSelectOffencesModel'
import TimeSpentInCustodyAbroadOffencesForm from '../model/custody-abroad/timeSpentInCustodyAbroadOffencesForm'
import FullPageError from '../model/FullPageError'
import AuditAction from '../enumerations/auditType'
import AuditService from '../services/auditService'

export default class TimeSpentInCustodyAbroadRoutes {
  constructor(
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly prisonerService: PrisonerService,
    private readonly auditService: AuditService,
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

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )

    const timeSpentInCustodyAbroadAdjustments = adjustments.filter(it => it.adjustmentType === 'CUSTODY_ABROAD')
    if (!timeSpentInCustodyAbroadAdjustments.length) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/custody-abroad/view', {
      model: new TimeSpentInCustodyAbroadViewModel(
        prisonerNumber,
        timeSpentInCustodyAbroadAdjustments,
        sentencesAndOffences,
      ),
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

    adjustment.timeSpentInCustodyAbroad = {
      ...adjustment.timeSpentInCustodyAbroad,
      documentationSource: req.body.documentationSource,
    }

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

    return res.redirect(`/${nomsId}/custody-abroad/offences/${addOrEdit}/${id}`)
  }

  public offences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )
    const form = TimeSpentInCustodyAbroadOffencesForm.fromAdjustment(adjustment, sentencesAndOffences)

    return res.render('pages/adjustments/custody-abroad/offences', {
      model: new TimeSpentInCustodyAbroadSelectOffencesModel(
        id,
        prisonerNumber,
        adjustment,
        form,
        sentencesAndOffences,
        addOrEdit,
      ),
    })
  }

  public submitOffences: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }

    const adjustmentForm = new TimeSpentInCustodyAbroadOffencesForm(req.body)

    await adjustmentForm.validate()
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (adjustmentForm.errors.length) {
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        bookingId,
        username,
      )

      return res.render('pages/adjustments/custody-abroad/offences', {
        model: new TimeSpentInCustodyAbroadSelectOffencesModel(
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

    return res.redirect(`/${nomsId}/custody-abroad/review/${addOrEdit}/${id}`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/custody-abroad/review', {
      model: new TimeSpentInCustodyAbroadReviewModel(nomsId, id, addOrEdit, adjustment, sentencesAndOffences),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const adjustment = this.adjustmentsStoreService.getOnly(req, nomsId)

    if (adjustment) {
      if (adjustment.id) {
        await this.adjustmentsService.update(adjustment.id, adjustment, username)
        await this.auditService.sendAuditMessage(
          AuditAction.CUSTODY_ABROAD_EDIT,
          username,
          adjustment.person,
          adjustment.id,
        )
      } else {
        await this.adjustmentsService.create([adjustment], username)
        await this.auditService.sendAuditMessage(
          AuditAction.CUSTODY_ABROAD_ADD,
          username,
          adjustment.person,
          adjustment.id,
        )
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
    await this.auditService.sendAuditMessage(AuditAction.CUSTODY_ABROAD_DELETE, username, adjustment.person, id)
    const message = JSON.stringify({
      type: adjustment.adjustmentType,
      days: adjustment.days,
      action: 'REMOVE',
    } as Message)
    return res.redirect(`/${nomsId}/success?message=${message}`)
  }
}

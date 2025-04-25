import { RequestHandler } from 'express'
import { randomUUID } from 'crypto'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import AdjustmentsService from '../services/adjustmentsService'
import PrisonerService from '../services/prisonerService'
import TimeSpentAsAnAppealApplicantDaysForm from '../model/appeal-applicant/timeSpentAsAnAppealApplicantDaysForm'
import TimeSpentAsAnAppealApplicantDaysModel from '../model/appeal-applicant/timeSpentAsAnAppealApplicantDaysModel'
import TimeSpentAsAnAppealApplicantReferenceModel from '../model/appeal-applicant/timeSpentAsAnAppealApplicantReferenceModel'
import ValidationError from '../model/validationError'
import TimeSpentAsAnAppealApplicantReviewModel from '../model/appeal-applicant/timeSpentAsAnAppealApplicantReviewModel'
import { Message } from '../model/adjustmentsHubViewModel'
import TimeSpentAsAnAppealApplicantViewModel from '../model/appeal-applicant/timeSpentAsAnAppealApplicantViewModel'
import TimeSpentAsAnAppealApplicantRemoveModel from '../model/appeal-applicant/timeSpentAsAnAppealApplicantRemoveModel'
import FullPageError from '../model/FullPageError'
import TimeSpentAsAnAppealApplicantSelectOffencesModel from '../model/appeal-applicant/timeSpentAsAnAppealApplicantSelectOffencesModel'
import TimeSpentAsAnAppealApplicantOffencesForm from '../model/appeal-applicant/timeSpentAsAnAppealApplicantOffencesForm'
import AuditService from '../services/auditService'
import AuditAction from '../enumerations/auditType'

export default class TimeSpentAsAnAppealApplicantRoutes {
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
      adjustmentType: 'APPEAL_APPLICANT',
      bookingId: parseInt(bookingId, 10),
      person: nomsId,
      prisonId,
    })

    return res.redirect(`/${nomsId}/appeal-applicant/days/add/${sessionId}`)
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const { bookingId } = res.locals.prisoner
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

    const timeSpentAsAnAppealApplicantAdjustments = adjustments.filter(it => it.adjustmentType === 'APPEAL_APPLICANT')
    if (!timeSpentAsAnAppealApplicantAdjustments.length) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/appeal-applicant/view', {
      model: new TimeSpentAsAnAppealApplicantViewModel(
        nomsId,
        timeSpentAsAnAppealApplicantAdjustments,
        sentencesAndOffences,
      ),
    })
  }

  public reference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const reference = adjustment.timeSpentAsAnAppealApplicant?.courtOfAppealReferenceNumber
    return res.render('pages/adjustments/appeal-applicant/reference', {
      model: new TimeSpentAsAnAppealApplicantReferenceModel(nomsId, id, addOrEdit, adjustment, reference),
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    const errors = this.validateReference(req.body.reference)

    if (errors.length > 0) {
      return res.render('pages/adjustments/appeal-applicant/reference', {
        model: new TimeSpentAsAnAppealApplicantReferenceModel(
          nomsId,
          id,
          addOrEdit,
          adjustment,
          req.body.reference,
          errors,
        ),
      })
    }

    adjustment.timeSpentAsAnAppealApplicant = {
      ...adjustment.timeSpentAsAnAppealApplicant,
      courtOfAppealReferenceNumber: req.body.reference.toUpperCase(),
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustment)

    return res.redirect(`/${nomsId}/appeal-applicant/offences/${addOrEdit}/${id}`)
  }

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { username } = res.locals.user

    let adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    adjustment = adjustment || (await this.adjustmentsService.get(id, username))
    this.adjustmentsStoreService.store(req, nomsId, id, adjustment)

    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }
    const form = TimeSpentAsAnAppealApplicantDaysForm.fromAdjustment(adjustment)

    return res.render(`pages/adjustments/appeal-applicant/days`, {
      model: new TimeSpentAsAnAppealApplicantDaysModel(nomsId, id, addOrEdit, form, adjustment),
    })
  }

  public submitDays: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit, id } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const adjustmentForm = new TimeSpentAsAnAppealApplicantDaysForm({ ...req.body, isEdit: false, adjustmentId: id })
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    await adjustmentForm.validate()
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/appeal-applicant/days', {
        model: new TimeSpentAsAnAppealApplicantDaysModel(prisonerNumber, id, addOrEdit, adjustmentForm, adjustment),
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    return res.redirect(`/${nomsId}/appeal-applicant/reference/${addOrEdit}/${id}`)
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
    const form = TimeSpentAsAnAppealApplicantOffencesForm.fromAdjustment(adjustment, sentencesAndOffences)

    return res.render('pages/adjustments/appeal-applicant/offences', {
      model: new TimeSpentAsAnAppealApplicantSelectOffencesModel(
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

    const adjustmentForm = new TimeSpentAsAnAppealApplicantOffencesForm(req.body)

    await adjustmentForm.validate()
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)

    if (adjustmentForm.errors.length) {
      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
        bookingId,
        username,
      )

      return res.render('pages/adjustments/appeal-applicant/offences', {
        model: new TimeSpentAsAnAppealApplicantSelectOffencesModel(
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

    return res.redirect(`/${nomsId}/appeal-applicant/review/${addOrEdit}/${id}`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { bookingId } = res.locals.prisoner

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )
    if (!adjustment) {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/appeal-applicant/review', {
      model: new TimeSpentAsAnAppealApplicantReviewModel(nomsId, id, addOrEdit, adjustment, sentencesAndOffences),
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
          AuditAction.TIME_SPENT_AS_APPEAL_APPLICANT_EDIT,
          username,
          adjustment.person,
          adjustment.id,
        )
      } else {
        await this.adjustmentsService.create([adjustment], username)
        await this.auditService.sendAuditMessage(
          AuditAction.TIME_SPENT_AS_APPEAL_APPLICANT_ADD,
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
    const { bookingId } = res.locals.prisoner

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffencesFilteredForRemand(
      bookingId,
      username,
    )

    const adjustment = await this.adjustmentsService.get(id, username)
    return res.render('pages/adjustments/appeal-applicant/remove', {
      model: new TimeSpentAsAnAppealApplicantRemoveModel(nomsId, adjustment, sentencesAndOffences),
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
    await this.auditService.sendAuditMessage(
      AuditAction.TIME_SPENT_AS_APPEAL_APPLICANT_DELETE,
      username,
      adjustment.person,
      adjustment.id,
    )
    return res.redirect(`/${nomsId}/success?message=${message}`)
  }

  private validateReference(reference: string): ValidationError[] {
    const errors = []
    if (reference.length === 0) {
      errors.push({
        html: 'Enter a Court of Appeal reference number',
        fields: ['reference'],
      })
      return errors
    }
    if (reference.length < 8 || reference.length > 30) {
      errors.push({
        html: 'Enter a Court of Appeal reference number between 8 and 30 characters',
        fields: ['reference'],
      })
    }
    if (reference.match(/[^a-zA-Z0-9]/)) {
      errors.push({
        html: 'A Court of Appeal reference number should only contain letters and numbers',
        fields: ['reference'],
      })
    }
    return errors
  }
}

import { RequestHandler } from 'express'
import UnusedDeductionsDaysModel from '../model/unusedDeductionsDaysModel'
import UnusedDeductionsDaysForm from '../model/unusedDeductionsDaysForm'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import UnusedDeductionsReviewModel from '../model/unusedDeductionsReviewModel'
import { Message } from '../model/adjustmentsHubViewModel'
import SessionAdjustment from '../@types/AdjustmentTypes'

export default class UnusedDeductionRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
  ) {}

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner

    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )
    const sessionAdjustment = this.adjustmentsStoreService.getOnly(req, nomsId)
    if (addOrEdit === 'edit') {
      const unusedDeductionAdjustment = adjustments
        .filter(it => it.source !== 'NOMIS')
        .find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
      return res.render('pages/adjustments/unused-deductions/days', {
        model: new UnusedDeductionsDaysModel(
          prisonerNumber,
          addOrEdit,
          UnusedDeductionsDaysForm.fromAdjustment(unusedDeductionAdjustment, sessionAdjustment?.days),
        ),
      })
    }

    return res.render('pages/adjustments/unused-deductions/days', {
      model: new UnusedDeductionsDaysModel(
        prisonerNumber,
        addOrEdit,
        UnusedDeductionsDaysForm.fromOffenderId(prisonerNumber, sessionAdjustment?.days),
      ),
    })
  }

  public submitDays: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner

    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )

    const totalRemandAndTaggedBailDays =
      adjustments
        .filter(it => it.adjustmentType === 'TAGGED_BAIL' || it.adjustmentType === 'REMAND')
        ?.map(it => it.days)
        .reduce((acc, cur) => {
          return acc + cur
        }, 0) || 0

    const unusedDeductionsDaysForm = new UnusedDeductionsDaysForm({ ...req.body, totalRemandAndTaggedBailDays })
    await unusedDeductionsDaysForm.validate()
    if (unusedDeductionsDaysForm.errors.length) {
      return res.render('pages/adjustments/unused-deductions/days', {
        model: new UnusedDeductionsDaysModel(prisonerNumber, addOrEdit, unusedDeductionsDaysForm),
      })
    }

    this.adjustmentsStoreService.storeOnly(req, nomsId, UnusedDeductionsDaysForm.toAdjustment(unusedDeductionsDaysForm))
    return res.redirect(`/${nomsId}/unused-deductions/review/`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner

    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )

    const unusedDeductionAdjustment = adjustments
      .filter(it => it.source !== 'NOMIS')
      .find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
    const sessionAdjustment =
      this.adjustmentsStoreService.getOnly(req, nomsId) ||
      ({ adjustmentType: 'UNUSED_DEDUCTIONS', days: 0 } as SessionAdjustment)
    return res.render('pages/adjustments/unused-deductions/review', {
      model: new UnusedDeductionsReviewModel(
        prisonerNumber,
        unusedDeductionAdjustment ? 'edit' : 'add',
        sessionAdjustment,
        adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL' || it.adjustmentType === 'REMAND'),
      ),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )

    const unusedDeductionAdjustment = adjustments
      .filter(it => it.source !== 'NOMIS')
      .find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')

    const sessionAdjustment =
      this.adjustmentsStoreService.getOnly(req, nomsId) ||
      ({ adjustmentType: 'UNUSED_DEDUCTIONS', days: 0 } as SessionAdjustment)
    let messageDays = sessionAdjustment.days
    await this.adjustmentsService.setUnusedDaysManually(prisonerNumber, sessionAdjustment.days, username)
    let messageAction = addOrEdit === 'edit' ? 'UPDATE' : 'CREATE'
    if (sessionAdjustment.days === 0) {
      messageAction = 'REMOVE'
      messageDays = unusedDeductionAdjustment.effectiveDays
    }

    const message = {
      type: 'UNUSED_DEDUCTIONS',
      days: messageDays,
      action: messageAction,
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }
}

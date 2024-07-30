import { RequestHandler } from 'express'
import UnusedDeductionsDaysModel from '../model/unusedDeductionsDaysModel'
import UnusedDeductionsDaysForm from '../model/unusedDeductionsDaysForm'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import UnusedDeductionsReviewModel from '../model/unusedDeductionsReviewModel'
import { Message } from '../model/adjustmentsHubViewModel'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import ReviewDeductionsModel from '../model/reviewDeductionsModel'
import ParamStoreService from '../services/paramStoreService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'

export default class UnusedDeductionRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly paramStoreService: ParamStoreService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {}

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEdit } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner
    const adjustments = await this.getAdjustments(bookingId, username, nomsId)
    const sessionAdjustment = this.adjustmentsStoreService.getOnly(req, nomsId)
    if (addOrEdit === 'edit') {
      const unusedDeductionAdjustment = this.getUnusedDeduction(adjustments)
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
    const adjustments = await this.getAdjustments(bookingId, username, nomsId)

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
    return res.redirect(`/${nomsId}/unused-deductions/review/save`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, saveOrDelete } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner
    const reviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (reviewDeductions) {
      const adjustments = await this.getAdjustments(bookingId, username, nomsId)
      const unusedDeductionAdjustment =
        this.getNomisUnusedDeduction(adjustments) || this.getUnusedDeduction(adjustments)
      const sessionAdjustmentRecords = this.adjustmentsStoreService.getAll(req, nomsId)
      const sessionAdjustments: SessionAdjustment[] = Object.keys(sessionAdjustmentRecords).map(
        key => ({ ...sessionAdjustmentRecords[key] }) as SessionAdjustment,
      )

      const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)
      const unusedDeductionsResponse = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
        sessionAdjustmentRecords,
        adjustments,
        sentencesAndOffences,
        nomsId,
        username,
      )

      adjustments
        .filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
        .forEach(it => {
          if (!sessionAdjustments.find(adj => adj.id === it.id)) {
            sessionAdjustments.push(it)
          }
        })

      return res.render('pages/adjustments/unused-deductions/review', {
        model: new UnusedDeductionsReviewModel(
          prisonerNumber,
          unusedDeductionAdjustment ? 'edit' : 'add',
          unusedDeductionsResponse.unusedDeductions || 0,
          sessionAdjustments.filter(it => !it.delete),
          [],
          reviewDeductions,
        ),
      })
    }

    const adjustments = await this.getAdjustments(bookingId, username, nomsId)
    const unusedDeductionAdjustment = this.getUnusedDeduction(adjustments)
    const sessionAdjustment =
      saveOrDelete === 'save'
        ? this.adjustmentsStoreService.getOnly(req, nomsId)
        : ({ adjustmentType: 'UNUSED_DEDUCTIONS', days: 0 } as SessionAdjustment)
    return res.render('pages/adjustments/unused-deductions/review', {
      model: new UnusedDeductionsReviewModel(
        prisonerNumber,
        unusedDeductionAdjustment ? 'edit' : 'add',
        sessionAdjustment.days,
        adjustments.filter(it => it.adjustmentType === 'TAGGED_BAIL' || it.adjustmentType === 'REMAND'),
      ),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, saveOrDelete } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const adjustments = await this.getAdjustments(bookingId, username, nomsId)
    const reviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (reviewDeductions) {
      const sessionAdjustmentRecords = this.adjustmentsStoreService.getAll(req, nomsId)
      const sessionAdjustments: SessionAdjustment[] = Object.keys(sessionAdjustmentRecords).map(
        key => ({ ...sessionAdjustmentRecords[key] }) as SessionAdjustment,
      )

      adjustments
        .filter(it => (it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL') && it.source === 'NOMIS')
        .forEach(it => {
          if (!sessionAdjustments.find(adj => adj.id === it.id)) {
            sessionAdjustments.push(it)
          }
        })

      const observables: Promise<void | {
        adjustmentIds: string[]
      }>[] = []
      sessionAdjustments.forEach(it => {
        if (it.delete) {
          observables.push(this.adjustmentsService.delete(it.id, username))
        } else if (it.id) {
          observables.push(this.adjustmentsService.update(it.id, it, username))
        } else {
          observables.push(this.adjustmentsService.create([it], username))
        }
      })

      await Promise.all(observables)
    }

    const unusedDeductionAdjustment = this.getUnusedDeduction(adjustments)
    const sessionAdjustment =
      saveOrDelete === 'save'
        ? this.adjustmentsStoreService.getOnly(req, nomsId)
        : ({ adjustmentType: 'UNUSED_DEDUCTIONS', days: 0 } as SessionAdjustment)
    await this.adjustmentsService.setUnusedDaysManually(prisonerNumber, sessionAdjustment.days, username)

    let messageDays: number
    let messageAction: string
    if (saveOrDelete === 'save') {
      messageDays = sessionAdjustment.days
      messageAction = unusedDeductionAdjustment ? 'UPDATE' : 'CREATE'
    } else {
      messageDays = unusedDeductionAdjustment.effectiveDays
      messageAction = 'REMOVE'
    }

    const message = {
      type: 'UNUSED_DEDUCTIONS',
      days: messageDays,
      action: messageAction,
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public reviewDeductions: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { prisonerNumber, bookingId } = res.locals.prisoner
    const { username } = res.locals.user
    const adjustments = await this.getAdjustments(bookingId, username, nomsId)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)
    this.paramStoreService.store(req, 'returnToReviewDeductions', true)
    const sessionAdjustmentRecords = this.adjustmentsStoreService.getAll(req, nomsId)
    const sessionAdjustments: { id: string; adjustment: SessionAdjustment }[] = Object.keys(
      sessionAdjustmentRecords,
    ).map(key => ({
      id: key,
      adjustment: sessionAdjustmentRecords[key],
    }))
    return res.render('pages/adjustments/unused-deductions/review-deductions', {
      model: new ReviewDeductionsModel(
        prisonerNumber,
        adjustments.filter(it => it.source === 'NOMIS'),
        sentencesAndOffences,
        sessionAdjustments.filter(it => !it.adjustment.delete),
      ),
    })
  }

  public submitReviewDeductions: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    this.paramStoreService.store(req, 'returnToReviewDeductions', true)
    return res.redirect(`/${nomsId}/unused-deductions/review/save`)
  }

  private async getAdjustments(bookingId: string, username: string, nomsId: string): Promise<Adjustment[]> {
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    return this.adjustmentsService.findByPerson(nomsId, startOfSentenceEnvelope.earliestSentence, username)
  }

  private getUnusedDeduction(adjustments: Adjustment[]): Adjustment {
    return adjustments.filter(it => it.source !== 'NOMIS').find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
  }

  private getNomisUnusedDeduction(adjustments: Adjustment[]): Adjustment {
    return adjustments.filter(it => it.source === 'NOMIS').find(it => it.adjustmentType === 'UNUSED_DEDUCTIONS')
  }
}

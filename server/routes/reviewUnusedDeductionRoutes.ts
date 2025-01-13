import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import SessionAdjustment from '../@types/AdjustmentTypes'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import ReviewDeductionsModel from '../model/reviewDeductionsModel'
import ParamStoreService from '../services/paramStoreService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import UnusedDeductionsConfirmModel from '../model/unused-deductions/unusedDeductionsConfirmModel'

export default class ReviewUnusedDeductionRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly paramStoreService: ParamStoreService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {}

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { prisonerNumber, bookingId } = res.locals.prisoner
    const { username } = res.locals.user
    const reviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (!reviewDeductions) {
      // First entry to review deductions, clear the session.
      this.paramStoreService.store(req, 'returnToReviewDeductions', true)
      this.adjustmentsStoreService.clear(req, nomsId)
    }

    let sessionAdjustmentRecords = this.adjustmentsStoreService.getAll(req, nomsId)
    let sessionAdjustments: SessionAdjustment[] = Object.keys(sessionAdjustmentRecords).map(key => ({
      ...sessionAdjustmentRecords[key],
    }))

    // Remove invalid adjustments from the session storage.
    // Invalid adjustments are created when the use clicks 'back' when on the 'add' page for remand and tagged bail.
    if (sessionAdjustments.some(it => !it.source && !it.complete)) {
      sessionAdjustments.forEach(it => {
        if (!it.source && !it.complete) {
          this.adjustmentsStoreService.remove(req, nomsId, it.id)
        }
      })

      sessionAdjustmentRecords = this.adjustmentsStoreService.getAll(req, nomsId)
      sessionAdjustments = Object.keys(sessionAdjustmentRecords).map(key => ({
        ...sessionAdjustmentRecords[key],
      }))
    }

    if (!sessionAdjustments || sessionAdjustments.length === 0) {
      const adjustments = await this.getAdjustments(bookingId, username, nomsId)
      adjustments
        .filter(it => it.adjustmentType === 'REMAND' || it.adjustmentType === 'TAGGED_BAIL')
        .forEach(it => {
          sessionAdjustments.push(it)
          this.adjustmentsStoreService.store(req, nomsId, it.id, it)
        })
    }

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)

    return res.render('pages/adjustments/unused-deductions/review-deductions', {
      model: new ReviewDeductionsModel(prisonerNumber, sessionAdjustments, sentencesAndOffences),
    })
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    this.paramStoreService.store(req, 'returnToReviewDeductions', true)
    return res.redirect(`/${nomsId}/review-deductions/confirm`)
  }

  public confirm: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const { username } = res.locals.user
    const { bookingId } = res.locals.prisoner
    const adjustments = await this.getAdjustments(bookingId, username, nomsId)
    const sessionAdjustmentRecords = this.adjustmentsStoreService.getAll(req, nomsId)
    const sessionAdjustments: SessionAdjustment[] = Object.keys(sessionAdjustmentRecords).map(
      key => ({ ...sessionAdjustmentRecords[key] }) as SessionAdjustment,
    )

    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(bookingId, username)

    const nonDeductions = adjustments.filter(
      it => it.adjustmentType !== 'REMAND' && it.adjustmentType !== 'TAGGED_BAIL',
    )
    const unusedDeductionsResponse = await this.calculateReleaseDatesService.unusedDeductionsHandlingCRDError(
      sessionAdjustmentRecords,
      nonDeductions,
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

    return res.render('pages/adjustments/unused-deductions/confirm', {
      model: new UnusedDeductionsConfirmModel(
        prisonerNumber,
        null,
        unusedDeductionsResponse?.unusedDeductions || 0,
        sessionAdjustments.filter(it => !it.delete),
        [],
        true,
      ),
    })
  }

  public submitConfirm: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { bookingId } = res.locals.prisoner
    const { username } = res.locals.user
    const adjustments = await this.getAdjustments(bookingId, username, nomsId)
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

    await Promise.all(
      sessionAdjustments.map(it => {
        if (it.delete) {
          return this.adjustmentsService.delete(it.id, username)
        }

        if (this.paramStoreService.get(req, it.id)) {
          return this.adjustmentsService.create([it], username)
        }

        return this.adjustmentsService.update(it.id, it, username)
      }),
    )

    return res.redirect(`/${nomsId}/success`)
  }

  private async getAdjustments(bookingId: string, username: string, nomsId: string): Promise<Adjustment[]> {
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    return this.adjustmentsService.findByPerson(nomsId, startOfSentenceEnvelope.earliestSentence, username)
  }
}

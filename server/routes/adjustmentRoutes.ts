import { RequestHandler } from 'express'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsListViewModel, { Message } from '../model/adjustmentsListModel'
import config from '../config'
import AdditionalDaysModel from '../model/additionalDaysModel'
import RestoredAdditionalDaysForm from '../model/restoredAdditionalDaysForm'
import ReviewModel from '../model/reviewModel'
import { AdjustmentDetails } from '../@types/adjustments/adjustmentsTypes'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'

export default class AdjustmentRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly identifyRemandPeriodsService: IdentifyRemandPeriodsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
  ) {}

  public entry: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    return res.redirect(`/adjustments/${prisonId}/start`)
  }

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    return res.render('pages/adjustments/start', {
      model: {
        prisonerDetail,
      },
    })
  }

  public success: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    req.flash('message', req.query.message as string)
    return res.redirect(`/${nomsId}`)
  }

  public list: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)
    const relevantRemand = await this.identifyRemandPeriodsService.calculateRelevantRemand(nomsId, token)
    const message = req.flash('message')
    return res.render('pages/adjustments/list', {
      model: new AdjustmentsListViewModel(
        prisonerDetail,
        adjustments,
        relevantRemand.sentenceRemand,
        message && message[0] && (JSON.parse(message[0]) as Message),
      ),
    })
  }

  public remand: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.redirect(`${config.services.identifyRemandPeriods.url}/${nomsId}`)
  }

  public additionalDays: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjudicationsSearch = await this.prisonerService.getAdjudications(nomsId, token)
    const adjudications = await Promise.all(
      adjudicationsSearch.results.map(adj =>
        this.prisonerService.getAdjudication(nomsId, adj.adjudicationNumber, token),
      ),
    )

    return res.render('pages/adjustments/additionalDays', {
      model: new AdditionalDaysModel(prisonerDetail, adjudications),
    })
  }

  public restoredAdditionalDays: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    return res.render('pages/adjustments/restoredAdditionalDays', {
      model: { prisonerDetail, form: new RestoredAdditionalDaysForm({}) },
    })
  }

  public submitRestoredAdditionalDays: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new RestoredAdditionalDaysForm(req.body)
    const adjustment = adjustmentForm.toAdjustmentDetails(prisonerDetail.bookingId, nomsId)

    this.adjustmentsStoreService.store(req, nomsId, adjustment)

    return res.redirect(`/${nomsId}/review`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    if (this.adjustmentsStoreService.get(req, nomsId)?.length) {
      return res.render('pages/adjustments/review', {
        model: new ReviewModel(prisonerDetail, this.adjustmentsStoreService.get(req, nomsId)),
      })
    }
    return res.redirect(`/${nomsId}`)
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    if (this.adjustmentsStoreService.get(req, nomsId)?.length) {
      await Promise.all(
        this.adjustmentsStoreService
          .get(req, nomsId)
          .map((it: AdjustmentDetails) => this.adjustmentsService.create(it, token)),
      )
    }
    return res.redirect(`/${nomsId}`)
  }
}

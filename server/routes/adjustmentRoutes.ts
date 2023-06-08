import { RequestHandler } from 'express'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsListViewModel, { Message } from '../model/adjustmentsListModel'
import config from '../config'
import AdditionalDaysModel from '../model/additionalDaysModel'

export default class AdjustmentRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly identifyRemandPeriodsService: IdentifyRemandPeriodsService,
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
    const adjustments = await this.adjustmentsService.findByPersonAndSource(nomsId, 'DPS', token)
    const relevantRemand = await this.identifyRemandPeriodsService.calculateRelevantRemand(nomsId, token)
    const message = req.flash('message')
    return res.render('pages/adjustments/list', {
      model: new AdjustmentsListViewModel(
        prisonerDetail,
        adjustments,
        relevantRemand.sentenceRemand,
        message[0] && (JSON.parse(message[0]) as Message),
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
}

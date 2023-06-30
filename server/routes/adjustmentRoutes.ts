import { RequestHandler } from 'express'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsListViewModel, { Message } from '../model/adjustmentsListModel'
import config from '../config'
import AdditionalDaysModel from '../model/additionalDaysModel'
import RestoredAdditionalDaysForm from '../model/restoredAdditionalDaysForm'
import ReviewModel from '../model/reviewModel'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import WarningModel from '../model/warningModel'
import WarningForm from '../model/warningForm'
import adjustmentTypes from '../model/adjustmentTypes'
import ViewModel from '../model/viewModel'

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

    adjustmentForm.validate()

    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/restoredAdditionalDays', {
        model: { prisonerDetail, form: adjustmentForm },
      })
    }

    const adjustment = adjustmentForm.toAdjustmentDetails(prisonerDetail.bookingId, nomsId)

    const messages = await this.adjustmentsService.validate(adjustment, token)

    const validationMessages = messages.filter(it => it.type === 'VALIDATION')

    if (validationMessages.length) {
      adjustmentForm.addErrors(validationMessages)
      return res.render('pages/adjustments/restoredAdditionalDays', {
        model: { prisonerDetail, form: adjustmentForm },
      })
    }

    this.adjustmentsStoreService.store(req, nomsId, adjustment)

    const warnings = messages.filter(it => it.type === 'WARNING')
    if (warnings.length) {
      return res.redirect(`/${nomsId}/warning`)
    }

    return res.redirect(`/${nomsId}/review`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    if (this.adjustmentsStoreService.get(req, nomsId)) {
      return res.render('pages/adjustments/review', {
        model: new ReviewModel(prisonerDetail, this.adjustmentsStoreService.get(req, nomsId)),
      })
    }
    return res.redirect(`/${nomsId}`)
  }

  public submitReview: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params

    const adjustment = this.adjustmentsStoreService.get(req, nomsId)
    if (adjustment) {
      await this.adjustmentsService.create(adjustment, token)
      const message = JSON.stringify({
        type: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
        days: adjustment.days,
      })
      return res.redirect(`/${nomsId}/success?message=${message}`)
    }
    return res.redirect(`/${nomsId}`)
  }

  public warning: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    const adjustment = this.adjustmentsStoreService.get(req, nomsId)
    if (adjustment) {
      const warning = (await this.adjustmentsService.validate(adjustment, token)).find(it => it.type === 'WARNING')
      if (warning) {
        return res.render('pages/adjustments/warning', {
          model: new WarningModel(prisonerDetail, adjustment, warning, new WarningForm({})),
        })
      }
    }
    return res.redirect(`/${nomsId}`)
  }

  public submitWarning: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const warningForm = new WarningForm(req.body)

    warningForm.validate()

    if (warningForm.errors.length) {
      const adjustment = this.adjustmentsStoreService.get(req, nomsId)
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
      if (adjustment) {
        const warning = (await this.adjustmentsService.validate(adjustment, token)).find(it => it.type === 'WARNING')
        return res.render('pages/adjustments/warning', {
          model: new WarningModel(prisonerDetail, adjustment, warning, warningForm),
        })
      }
    }
    if (warningForm.confirm === 'yes') {
      return res.redirect(`/${nomsId}/review`)
    }
    return res.redirect(`/${nomsId}`)
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentTypeUrl } = req.params
    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)
    return res.render('pages/adjustments/view', {
      model: new ViewModel(prisonerDetail, adjustments, adjustmentType),
    })
  }
}

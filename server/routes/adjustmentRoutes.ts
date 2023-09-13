import { RequestHandler } from 'express'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsHubViewModel, { Message } from '../model/adjustmentsHubViewModel'
import config from '../config'
import AdditionalDaysModel from '../model/additionalDaysModel'
import ReviewModel from '../model/reviewModel'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import WarningModel from '../model/warningModel'
import WarningForm from '../model/warningForm'
import adjustmentTypes from '../model/adjustmentTypes'
import ViewModel from '../model/viewModel'
import RemoveModel from '../model/removeModel'
import AdjustmentsFormFactory from '../model/adjustmentFormFactory'
import hubValidationMessages from '../model/hubValidationMessages'

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

  public hub: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)
    const remandDecision = await this.identifyRemandPeriodsService.getRemandDecision(nomsId, token)
    let relevantRemand
    try {
      relevantRemand = await this.identifyRemandPeriodsService.calculateRelevantRemand(nomsId, token)
    } catch {
      // Nothing to do, remand review won't be displayed.
    }
    const message = req.flash('message')
    return res.render('pages/adjustments/hub', {
      model: new AdjustmentsHubViewModel(
        prisonerDetail,
        adjustments,
        relevantRemand,
        remandDecision,
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

  public form: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentTypeUrl, addOrEdit, id } = req.params

    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }
    if (adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      const adjustments = await this.adjustmentsService.findByPerson(nomsId, token)
      if (!adjustments.some(a => a.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')) {
        req.flash('message', JSON.stringify(hubValidationMessages.RADA_NO_ADAS_EXIST))
        return res.redirect(`/${nomsId}`)
      }
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    let adjustment = null
    if (addOrEdit === 'edit') {
      const sessionAdjustment = this.adjustmentsStoreService.get(req, nomsId)
      if (id && sessionAdjustment?.id !== id) {
        adjustment = await this.adjustmentsService.get(id, token)
      } else {
        adjustment = sessionAdjustment
      }
    }
    const form = adjustment
      ? AdjustmentsFormFactory.fromAdjustment(adjustment)
      : AdjustmentsFormFactory.fromType(adjustmentType)

    return res.render('pages/adjustments/form', {
      model: { prisonerDetail, form, addOrEdit, id },
    })
  }

  public submitForm: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentTypeUrl, addOrEdit, id } = req.params

    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = AdjustmentsFormFactory.fromRequest(req, adjustmentType)

    await adjustmentForm.validate(() => this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token))

    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/form', {
        model: { prisonerDetail, form: adjustmentForm, addOrEdit, id },
      })
    }

    const adjustment = adjustmentForm.toAdjustment(prisonerDetail, nomsId, id)

    const messages = await this.adjustmentsService.validate(adjustment, token)

    const validationMessages = messages.filter(it => it.type === 'VALIDATION')

    if (validationMessages.length) {
      adjustmentForm.addErrors(validationMessages)
      return res.render('pages/adjustments/form', {
        model: { prisonerDetail, form: adjustmentForm, addOrEdit, id },
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

    let adjustment = this.adjustmentsStoreService.get(req, nomsId)
    if (adjustment) {
      let adjustmentId
      if (adjustment.id) {
        await this.adjustmentsService.update(adjustment.id, adjustment, token)
        adjustmentId = adjustment.id
      } else {
        adjustmentId = (await this.adjustmentsService.create(adjustment, token)).adjustmentId
      }
      const message = {
        type: adjustment.adjustmentType,
        days: adjustment.days,
        action: adjustment.id ? 'UPDATE' : 'CREATE',
      } as Message
      adjustment = await this.adjustmentsService.get(adjustmentId, token)
      message.days = adjustment.days
      return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
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

    await warningForm.validate()

    const adjustment = this.adjustmentsStoreService.get(req, nomsId)
    if (adjustment) {
      if (warningForm.errors.length) {
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
      const adjustmentType = adjustmentTypes.find(it => it.value === adjustment.adjustmentType)
      return res.redirect(`/${nomsId}/${adjustmentType.url}/edit`)
    }
    return res.redirect(`/${nomsId}/`)
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
    const remandDecision =
      adjustmentType.value === 'REMAND'
        ? await this.identifyRemandPeriodsService.getRemandDecision(nomsId, token)
        : null
    return res.render('pages/adjustments/view', {
      model: new ViewModel(prisonerDetail, adjustments, adjustmentType, remandDecision),
    })
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentTypeUrl, id } = req.params
    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = await this.adjustmentsService.get(id, token)
    return res.render('pages/adjustments/remove', {
      model: new RemoveModel(prisonerDetail, adjustment, adjustmentType),
    })
  }

  public submitRemove: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId, id } = req.params

    const adjustment = await this.adjustmentsService.get(id, token)
    await this.adjustmentsService.delete(id, token)
    const message = JSON.stringify({
      type: adjustment.adjustmentType,
      days: adjustment.days,
      action: 'REMOVE',
    } as Message)
    return res.redirect(`/${nomsId}/success?message=${message}`)
  }
}

import { RequestHandler } from 'express'
import IdentifyRemandPeriodsService from '../services/identifyRemandPeriodsService'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsHubViewModel, { Message } from '../model/adjustmentsHubViewModel'
import config from '../config'
import ReviewModel from '../model/reviewModel'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import WarningModel from '../model/warningModel'
import WarningForm from '../model/warningForm'
import adjustmentTypes from '../model/adjustmentTypes'
import ViewModel from '../model/viewModel'
import RemoveModel from '../model/removeModel'
import AdjustmentsFormFactory from '../model/adjustmentFormFactory'
import hubValidationMessages from '../model/hubValidationMessages'
import FullPageError from '../model/FullPageError'
import { daysBetween } from '../utils/utils'
import RecallModel from '../model/recallModel'
import RecallForm from '../model/recallForm'
import UnusedDeductionsService from '../services/unusedDeductionsService'
import { Adjustment } from '../@types/adjustments/adjustmentsTypes'
import ParamStoreService from '../services/paramStoreService'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'

export default class AdjustmentRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly identifyRemandPeriodsService: IdentifyRemandPeriodsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly unusedDeductionsService: UnusedDeductionsService,
    private readonly paramStoreService: ParamStoreService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {}

  public entry: RequestHandler = async (req, res): Promise<void> => {
    const { prisonId } = req.query as Record<string, string>
    return res.redirect(`/adjustments/${prisonId}/start`)
  }

  public start: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/adjustments/start')
  }

  public success: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    req.flash('message', req.query.message as string)
    return res.redirect(`/${nomsId}`)
  }

  public hub: RequestHandler = async (req, res): Promise<void> => {
    const { username, roles, activeCaseLoadId, token } = res.locals.user
    const { nomsId } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner

    const message = req.flash('message')
    const messageExists = message && message[0]
    const reviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (reviewDeductions) {
      this.paramStoreService.clear(req, 'returnToReviewDeductions')
    }

    if (messageExists || reviewDeductions) {
      this.adjustmentsStoreService.clear(req, nomsId)
    }

    if (messageExists) {
      this.courtCasesReleaseDatesService.evictCache(nomsId, username)
    }

    const [[unusedDeductionMessage, adjustments], adaAdjudicationDetails, serviceDefinitions] = await Promise.all([
      this.unusedDeductionsService.getCalculatedUnusedDeductionsMessageAndAdjustments(nomsId, bookingId, username),
      this.adjustmentsService.getAdaAdjudicationDetails(nomsId, username, activeCaseLoadId),
      this.courtCasesReleaseDatesService.getServiceDefinitions(prisonerNumber, token),
    ])

    const inactiveDeletedAdjustments =
      unusedDeductionMessage === 'RECALL'
        ? await this.adjustmentsService.findByPersonAndStatus(nomsId, 'INACTIVE_WHEN_DELETED', username)
        : []

    let remandDecision
    let remandResult
    let remandBannerVisible = false
    if (roles.includes('REMAND_IDENTIFIER')) {
      try {
        remandDecision = await this.identifyRemandPeriodsService.getRemandDecision(nomsId, username)
        remandResult = await this.identifyRemandPeriodsService.calculateRelevantRemand(nomsId, username)
        remandBannerVisible = serviceDefinitions.services.adjustments.thingsToDo.things.some(
          thing => thing.type === 'REVIEW_IDENTIFIED_REMAND',
        )
      } catch {
        // Nothing to do, remand review won't be displayed.
      }
    }

    return res.render('pages/adjustments/hub', {
      serviceDefinitions,
      model: new AdjustmentsHubViewModel(
        prisonerNumber,
        adjustments,
        remandDecision,
        remandResult,
        roles,
        message && message[0] && (JSON.parse(message[0]) as Message),
        unusedDeductionMessage,
        adaAdjudicationDetails,
        inactiveDeletedAdjustments,
        remandBannerVisible,
      ),
    })
  }

  public remand: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.redirect(`${config.services.identifyRemandPeriods.url}/prisoner/${nomsId}`)
  }

  public form: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, adjustmentTypeUrl, addOrEdit, id } = req.params
    const { bookingId } = res.locals.prisoner

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }

    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }

    if (adjustmentType.value === 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED') {
      const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
      const adjustments = await this.adjustmentsService.findByPerson(
        nomsId,
        startOfSentenceEnvelope.earliestSentence,
        username,
      )
      if (!adjustments.some(a => a.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')) {
        req.flash('message', JSON.stringify(hubValidationMessages.RADA_NO_ADAS_EXIST))
        return res.redirect(`/${nomsId}`)
      }
    }

    let adjustment: Adjustment = null
    if (addOrEdit === 'edit') {
      const sessionAdjustment = this.adjustmentsStoreService.getOnly(req, nomsId)
      if (id && sessionAdjustment?.id !== id) {
        adjustment = await this.adjustmentsService.get(id, username)
      } else {
        adjustment = sessionAdjustment
      }
    }
    const form = adjustment
      ? AdjustmentsFormFactory.fromAdjustment(adjustment)
      : AdjustmentsFormFactory.fromType(adjustmentType)

    return res.render('pages/adjustments/form', {
      model: { form, addOrEdit, id },
    })
  }

  public submitForm: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, adjustmentTypeUrl, addOrEdit, id } = req.params
    const { bookingId } = res.locals.prisoner

    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }

    const adjustmentForm = AdjustmentsFormFactory.fromRequest(req, adjustmentType)

    await adjustmentForm.validate(() => this.prisonerService.getSentencesAndOffences(bookingId, username))

    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/form', {
        model: { form: adjustmentForm, addOrEdit, id },
      })
    }

    const adjustment = adjustmentForm.toAdjustment(res.locals.prisoner, nomsId, id)

    const messages = await this.adjustmentsService.validate(adjustment, username)

    const validationMessages = messages.filter(it => it.type === 'VALIDATION')

    if (validationMessages.length) {
      adjustmentForm.addErrors(validationMessages)
      return res.render('pages/adjustments/form', {
        model: { form: adjustmentForm, addOrEdit, id },
      })
    }

    this.adjustmentsStoreService.storeOnly(req, nomsId, adjustment)

    const warnings = messages.filter(it => it.type === 'WARNING')
    if (warnings.length) {
      return res.redirect(`/${nomsId}/warning`)
    }

    return res.redirect(`/${nomsId}/review`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params

    if (this.adjustmentsStoreService.getOnly(req, nomsId)) {
      return res.render('pages/adjustments/review', {
        model: new ReviewModel(this.adjustmentsStoreService.getOnly(req, nomsId)),
      })
    }
    return res.redirect(`/${nomsId}`)
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
        days: adjustment.days || daysBetween(new Date(adjustment.fromDate), new Date(adjustment.toDate)),
        action: adjustment.id ? 'UPDATE' : 'CREATE',
      } as Message
      return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
    }
    return res.redirect(`/${nomsId}`)
  }

  public warning: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const adjustment = this.adjustmentsStoreService.getOnly(req, nomsId)
    if (adjustment) {
      const warning = (await this.adjustmentsService.validate(adjustment, username)).find(it => it.type === 'WARNING')
      if (warning) {
        return res.render('pages/adjustments/warning', {
          model: new WarningModel(adjustment, warning, new WarningForm({})),
        })
      }
    }
    return res.redirect(`/${nomsId}`)
  }

  public submitWarning: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const warningForm = new WarningForm(req.body)

    await warningForm.validate()

    const adjustment = this.adjustmentsStoreService.getOnly(req, nomsId)
    if (adjustment) {
      if (warningForm.errors.length) {
        if (adjustment) {
          const warning = (await this.adjustmentsService.validate(adjustment, username)).find(
            it => it.type === 'WARNING',
          )
          return res.render('pages/adjustments/warning', {
            model: new WarningModel(adjustment, warning, warningForm),
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
    const { username, roles } = res.locals.user
    const { nomsId, adjustmentTypeUrl } = req.params
    const { bookingId } = res.locals.prisoner
    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, username)
    const adjustments = await this.adjustmentsService.findByPerson(
      nomsId,
      startOfSentenceEnvelope.earliestSentence,
      username,
    )
    const remandDecision =
      adjustmentType.value === 'REMAND' && roles.includes('REMAND_IDENTIFIER')
        ? await this.identifyRemandPeriodsService.getRemandDecision(nomsId, username)
        : null
    return res.render('pages/adjustments/view', {
      model: new ViewModel(adjustments, adjustmentType, remandDecision, roles),
    })
  }

  public remove: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, adjustmentTypeUrl, id } = req.params
    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }
    const adjustment = await this.adjustmentsService.get(id, username)
    return res.render('pages/adjustments/remove', {
      model: new RemoveModel(adjustment, adjustmentType),
    })
  }

  public submitRemove: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId, id } = req.params

    if (this.paramStoreService.get(req, id)) {
      this.adjustmentsStoreService.remove(req, nomsId, id)
      return res.redirect(`/${nomsId}/review-deductions`)
    }

    const adjustment = await this.adjustmentsService.get(id, username)
    const returnToReviewDeductions = this.paramStoreService.get(req, 'returnToReviewDeductions')
    if (returnToReviewDeductions) {
      this.adjustmentsStoreService.store(req, nomsId, id, { ...adjustment, delete: true })
      return res.redirect(`/${nomsId}/review-deductions`)
    }

    await this.adjustmentsService.delete(id, username)
    const message = JSON.stringify({
      type: adjustment.adjustmentType,
      days: adjustment.days,
      action: 'REMOVE',
    } as Message)
    return res.redirect(`/${nomsId}/success?message=${message}`)
  }

  public recall: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params
    const adjustments = await this.adjustmentsService.findByPersonAndStatus(nomsId, 'INACTIVE_WHEN_DELETED', username)

    return res.render('pages/adjustments/recall', {
      model: new RecallModel(adjustments, new RecallForm({})),
    })
  }

  public recallSubmit: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const recallForm = new RecallForm(req.body)

    await recallForm.validate()
    if (recallForm.errors.length) {
      const adjustments = await this.adjustmentsService.findByPersonAndStatus(nomsId, 'INACTIVE_WHEN_DELETED', username)

      return res.render('pages/adjustments/recall', {
        model: new RecallModel(adjustments, recallForm),
      })
    }
    await this.adjustmentsService.restore({ ids: recallForm.getSelectedAdjustments() }, username)
    const message = {
      type: 'REMAND',
      action: 'UPDATE',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }
}

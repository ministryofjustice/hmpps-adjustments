import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import { AdasToReview, PadasToReview } from '../@types/AdaTypes'
import { Message } from '../model/adjustmentsHubViewModel'
import PadaForm from '../model/padaForm'
import AdditionalDaysAwardedBackendService from '../services/additionalDaysAwardedBackendService'
import AdjustmentsService from '../services/adjustmentsService'

export default class AdditionalDaysAwardedRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly additionalDaysAwardedBackendService: AdditionalDaysAwardedBackendService,
    private readonly adjustmentsService: AdjustmentsService,
  ) {}

  public intercept: RequestHandler = async (req, res): Promise<void> => {
    const { token, activeCaseLoadId } = res.locals.user
    const { nomsId } = req.params
    const { prisonerNumber } = res.locals.prisoner
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(prisonerNumber, token, activeCaseLoadId)

    if (response.intercept.type === 'NONE') {
      return res.redirect(`/${nomsId}`)
    }

    let numOfAdaAdjudications = 0
    numOfAdaAdjudications += response.totalAwaitingApproval
    numOfAdaAdjudications += response.totalProspective

    return res.render('pages/adjustments/additional-days/intercept', {
      model: {
        intercept: response.intercept,
        numOfAdaAdjudications,
      },
    })
  }

  public reviewAndApprove: RequestHandler = async (req, res): Promise<void> => {
    const { token, activeCaseLoadId } = res.locals.user
    const { nomsId } = req.params
    const { prisoner } = res.locals

    const adasToReview: AdasToReview = await this.additionalDaysAwardedBackendService.getAdasToApprove(
      req,
      nomsId,
      token,
      activeCaseLoadId,
    )

    if (adasToReview.intercept.type === 'PADA' && !adasToReview.awaitingApproval.length) {
      // Intercepted for PADAs, none have been selected.
      await this.additionalDaysAwardedBackendService.submitAdjustments(req, prisoner, token, activeCaseLoadId)
      return res.redirect(`/${nomsId}`)
    }

    // If all awaiting approval are PADA's then redirect to the submit screen (skip approve step)
    if (this.onlyPadasExist(adasToReview)) {
      return res.redirect(`/${nomsId}/additional-days/review-and-submit?referrer=REVIEW_PROSPECTIVE`)
    }

    return res.render('pages/adjustments/additional-days/review-and-approve', {
      adasToReview,
    })
  }

  private onlyPadasExist(adasToReview: AdasToReview) {
    return (
      adasToReview.quashed.length === 0 &&
      adasToReview.suspended.length === 0 &&
      adasToReview.awarded.length === 0 &&
      adasToReview.awaitingApproval.length &&
      !adasToReview.awaitingApproval.some(a => a.charges.some(c => c.status !== 'PROSPECTIVE'))
    )
  }

  public reviewPadas: RequestHandler = async (req, res): Promise<void> => {
    const { token, activeCaseLoadId } = res.locals.user
    const { nomsId } = req.params

    const padasToReview: PadasToReview = await this.additionalDaysAwardedBackendService.getPadasToApprove(
      nomsId,
      token,
      activeCaseLoadId,
    )

    return res.render('pages/adjustments/additional-days/review-prospective', {
      padasToReview,
    })
  }

  public submitPadas: RequestHandler = async (req, res): Promise<void> => {
    const { token, activeCaseLoadId } = res.locals.user
    const { nomsId } = req.params

    const padaForm = new PadaForm(req.body)

    await padaForm.validate()

    if (padaForm.errors.length) {
      const padasToReview: PadasToReview = await this.additionalDaysAwardedBackendService.getPadasToApprove(
        nomsId,
        token,
        activeCaseLoadId,
      )
      return res.render('pages/adjustments/additional-days/review-prospective', {
        padasToReview,
        padaForm,
      })
    }

    this.additionalDaysAwardedBackendService.storeSelectedPadas(req, nomsId, padaForm)

    return res.redirect(`/${nomsId}/additional-days/review-and-approve`)
  }

  public approve: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { referrer } = req.query as Record<string, string>
    return res.redirect(`/${nomsId}/additional-days/review-and-submit?referrer=${referrer}`)
  }

  public reviewAndSubmit: RequestHandler = async (req, res): Promise<void> => {
    const { token, activeCaseLoadId } = res.locals.user
    const { referrer } = req.query as Record<string, string>
    const model = await this.additionalDaysAwardedBackendService.getReviewAndSubmitModel(
      req,
      res.locals.prisoner,
      token,
      activeCaseLoadId,
    )
    return res.render('pages/adjustments/additional-days/review-and-submit', {
      model,
      referrer,
    })
  }

  public submit: RequestHandler = async (req, res): Promise<void> => {
    const { token, activeCaseLoadId } = res.locals.user
    const { nomsId } = req.params

    await this.additionalDaysAwardedBackendService.submitAdjustments(req, res.locals.prisoner, token, activeCaseLoadId)

    const message = {
      type: 'ADDITIONAL_DAYS_AWARDED',
      action: 'UPDATE',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public addWarning: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { bookingId } = res.locals.prisoner
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, token)

    return res.render('pages/adjustments/additional-days/add-warning', {
      model: {
        startOfSentenceEnvelope,
      },
    })
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { token, activeCaseLoadId } = res.locals.user
    const { nomsId } = req.params
    const adas = await this.additionalDaysAwardedBackendService.viewAdjustments(nomsId, token, activeCaseLoadId)

    return res.render('pages/adjustments/additional-days/view', {
      model: {
        adas,
      },
    })
  }
}

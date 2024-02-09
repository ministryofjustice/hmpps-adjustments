import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import { AdaIntercept, AdasToReview } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'
import { Message } from '../model/adjustmentsHubViewModel'
import PadaForm from '../model/padaForm'

export default class AdditionalDaysAwardedRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly additionalDaysAwardedService: AdditionalDaysAwardedService,
  ) {}

  public intercept: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
      prisonerDetail.bookingId,
      token,
    )
    const adjustments = await new AdjustmentsClient(token).findByPerson(prisonerDetail.offenderNo)

    const intercept: AdaIntercept = await this.additionalDaysAwardedService.shouldIntercept(
      req,
      prisonerDetail,
      adjustments,
      startOfSentenceEnvelope,
      token,
    )

    if (intercept.type === 'NONE') {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/additional-days/intercept', {
      model: {
        prisonerDetail,
        intercept,
      },
    })
  }

  public reviewAndApprove: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
      prisonerDetail.bookingId,
      token,
    )
    const adasToReview: AdasToReview = await this.additionalDaysAwardedService.getAdasToApprove(
      req,
      nomsId,
      startOfSentenceEnvelope,
      token,
    )

    if (adasToReview.intercept.type === 'PADA' && !adasToReview.awaitingApproval.length) {
      // Intercepted for PADAs, none have been selected.
      await this.additionalDaysAwardedService.submitAdjustments(req, prisonerDetail, startOfSentenceEnvelope, token)
      return res.redirect(`/${nomsId}`)
    }

    // If all awaiting approval are PADA's then redirect to the submit screen (skip approve step)
    if (this.onlyPadasExist(adasToReview)) {
      return res.redirect(`/${nomsId}/additional-days/review-and-submit?referrer=REVIEW_PROSPECTIVE`)
    }

    return res.render('pages/adjustments/additional-days/review-and-approve', {
      model: {
        prisonerDetail,
      },
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
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
      prisonerDetail.bookingId,
      token,
    )
    const padasToReview = await this.additionalDaysAwardedService.getPadasToApprove(
      nomsId,
      startOfSentenceEnvelope,
      token,
    )

    return res.render('pages/adjustments/additional-days/review-prospective', {
      model: {
        prisonerDetail,
      },
      padasToReview,
    })
  }

  public submitPadas: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params

    const padaForm = new PadaForm(req.body)

    await padaForm.validate()

    if (padaForm.errors.length) {
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
      const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
        prisonerDetail.bookingId,
        token,
      )
      const padasToReview = await this.additionalDaysAwardedService.getPadasToApprove(
        nomsId,
        startOfSentenceEnvelope,
        token,
      )
      return res.render('pages/adjustments/additional-days/review-prospective', {
        model: {
          prisonerDetail,
        },
        padasToReview,
        padaForm,
      })
    }

    this.additionalDaysAwardedService.storeSelectedPadas(req, nomsId, padaForm)

    return res.redirect(`/${nomsId}/additional-days/review-and-approve`)
  }

  public approve: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { referrer } = req.query as Record<string, string>
    return res.redirect(`/${nomsId}/additional-days/review-and-submit?referrer=${referrer}`)
  }

  public reviewAndSubmit: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const { referrer } = req.query as Record<string, string>
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
      prisonerDetail.bookingId,
      token,
    )

    return res.render('pages/adjustments/additional-days/review-and-submit', {
      model: await this.additionalDaysAwardedService.getReviewAndSubmitModel(
        req,
        prisonerDetail,
        startOfSentenceEnvelope,
        token,
      ),
      referrer,
    })
  }

  public submit: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
      prisonerDetail.bookingId,
      token,
    )
    await this.additionalDaysAwardedService.submitAdjustments(req, prisonerDetail, startOfSentenceEnvelope, token)

    const message = {
      action: 'ADDITIONAL_DAYS_UPDATED',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public addWarning: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
      prisonerDetail.bookingId,
      token,
    )

    return res.render('pages/adjustments/additional-days/add-warning', {
      model: {
        prisonerDetail,
        startOfSentenceEnvelope,
      },
    })
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelopeExcludingRecalls(
      prisonerDetail.bookingId,
      token,
    )
    const adas = await this.additionalDaysAwardedService.viewAdjustments(nomsId, startOfSentenceEnvelope, token)

    return res.render('pages/adjustments/additional-days/view', {
      model: {
        prisonerDetail,
        adas,
      },
    })
  }
}

import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import { AdaIntercept, AdasToReview, PadasToReview } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'
import { Message } from '../model/adjustmentsHubViewModel'
import PadaForm from '../model/padaForm'
import AdditionalDaysAwardedBackendService from '../services/additionalDaysAwardedBackendService'

export default class AdditionalDaysAwardedRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly additionalDaysAwardedService: AdditionalDaysAwardedService,
    private readonly additionalDaysAwardedBackendService: AdditionalDaysAwardedBackendService,
  ) {}

  public intercept: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { bookingId, prisonerNumber } = res.locals.prisoner
    const { service } = req.query as Record<string, string>
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, token)

    const adjustments = await new AdjustmentsClient(token).findByPerson(prisonerNumber)

    let intercept: AdaIntercept
    if (service === 'new') {
      intercept = await this.additionalDaysAwardedBackendService.shouldIntercept(prisonerNumber, token)
    } else {
      intercept = await this.additionalDaysAwardedService.shouldIntercept(
        req,
        prisonerNumber,
        adjustments,
        startOfSentenceEnvelope.earliestExcludingRecalls,
        token,
      )
    }

    if (intercept.type === 'NONE') {
      return res.redirect(`/${nomsId}`)
    }

    return res.render('pages/adjustments/additional-days/intercept', {
      model: {
        intercept,
      },
    })
  }

  public reviewAndApprove: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { prisoner } = res.locals
    const { service } = req.query as Record<string, string>
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(prisoner.bookingId, token)

    let adasToReview: AdasToReview
    if (service === 'new') {
      adasToReview = await this.additionalDaysAwardedBackendService.getAdasToApprove(req, nomsId, token)
    } else {
      adasToReview = await this.additionalDaysAwardedService.getAdasToApprove(
        req,
        nomsId,
        startOfSentenceEnvelope.earliestExcludingRecalls,
        token,
      )
    }

    if (adasToReview.intercept.type === 'PADA' && !adasToReview.awaitingApproval.length) {
      // Intercepted for PADAs, none have been selected.
      await this.additionalDaysAwardedService.submitAdjustments(
        req,
        prisoner,
        startOfSentenceEnvelope.earliestExcludingRecalls,
        token,
      )
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
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { bookingId } = res.locals.prisoner
    const { service } = req.query as Record<string, string>
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, token)

    let padasToReview: PadasToReview
    if (service === 'new') {
      padasToReview = await this.additionalDaysAwardedBackendService.getPadasToApprove(nomsId, token)
    } else {
      padasToReview = await this.additionalDaysAwardedService.getPadasToApprove(
        nomsId,
        startOfSentenceEnvelope.earliestExcludingRecalls,
        token,
      )
    }

    return res.render('pages/adjustments/additional-days/review-prospective', {
      padasToReview,
    })
  }

  public submitPadas: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { service } = req.query as Record<string, string>

    const padaForm = new PadaForm(req.body)

    await padaForm.validate()

    if (padaForm.errors.length) {
      const { bookingId } = res.locals.prisoner
      const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, token)

      let padasToReview: PadasToReview
      if (service === 'new') {
        padasToReview = await this.additionalDaysAwardedBackendService.getPadasToApprove(nomsId, token)
      } else {
        padasToReview = await this.additionalDaysAwardedService.getPadasToApprove(
          nomsId,
          startOfSentenceEnvelope.earliestExcludingRecalls,
          token,
        )
      }

      return res.render('pages/adjustments/additional-days/review-prospective', {
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
    const { token } = res.locals.user
    const { referrer } = req.query as Record<string, string>
    const { bookingId } = res.locals.prisoner
    const { service } = req.query as Record<string, string>

    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, token)

    let model
    if (service === 'new') {
      model = await this.additionalDaysAwardedBackendService.getReviewAndSubmitModel(req, res.locals.prisoner, token)
    } else {
      model = await this.additionalDaysAwardedService.getReviewAndSubmitModel(
        req,
        res.locals.prisoner,
        startOfSentenceEnvelope.earliestExcludingRecalls,
        token,
      )
    }
    return res.render('pages/adjustments/additional-days/review-and-submit', {
      model,
      referrer,
    })
  }

  public submit: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { bookingId } = res.locals.prisoner
    const { service } = req.query as Record<string, string>
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, token)

    if (service === 'new') {
      await this.additionalDaysAwardedBackendService.submitAdjustments(req, res.locals.prisoner, token)
    } else {
      await this.additionalDaysAwardedService.submitAdjustments(
        req,
        res.locals.prisoner,
        startOfSentenceEnvelope.earliestExcludingRecalls,
        token,
      )
    }

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
    const { token } = res.locals.user
    const { nomsId } = req.params
    const { bookingId } = res.locals.prisoner
    const { service } = req.query as Record<string, string>
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(bookingId, token)

    let adas
    if (service === 'new') {
      adas = await this.additionalDaysAwardedBackendService.viewAdjustments(nomsId, token)
    } else {
      adas = await this.additionalDaysAwardedService.viewAdjustments(
        nomsId,
        startOfSentenceEnvelope.earliestExcludingRecalls,
        token,
      )
    }

    return res.render('pages/adjustments/additional-days/view', {
      model: {
        adas,
      },
    })
  }
}

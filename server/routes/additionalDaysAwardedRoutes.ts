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
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    const adjustments = await new AdjustmentsClient(token).findByPerson(prisonerDetail.offenderNo)

    const intercept: AdaIntercept = await this.additionalDaysAwardedService.shouldIntercept(
      req,
      prisonerDetail,
      adjustments,
      startOfSentenceEnvelope,
      username,
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
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    const adasToReview: AdasToReview = await this.additionalDaysAwardedService.getAdasToApprove(
      req,
      nomsId,
      startOfSentenceEnvelope,
      username,
      token,
    )

    if (adasToReview.intercept.type === 'PADA' && !adasToReview.awaitingApproval.length) {
      // Intercepted for PADAs, none have been selected.
      await this.additionalDaysAwardedService.submitAdjustments(
        req,
        prisonerDetail,
        startOfSentenceEnvelope,
        username,
        token,
      )
      return res.redirect(`/${nomsId}`)
    }
    return res.render('pages/adjustments/additional-days/review-and-approve', {
      model: {
        prisonerDetail,
      },
      adasToReview,
    })
  }

  public reviewPadas: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    const padasToReview = await this.additionalDaysAwardedService.getPadasToApprove(
      nomsId,
      startOfSentenceEnvelope,
      username,
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
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params

    const padaForm = new PadaForm(req.body)

    await padaForm.validate()

    if (padaForm.errors.length) {
      const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
      const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
        prisonerDetail.bookingId,
        token,
      )
      const padasToReview = await this.additionalDaysAwardedService.getPadasToApprove(
        nomsId,
        startOfSentenceEnvelope,
        username,
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
    return res.redirect(`/${nomsId}/additional-days/review-and-submit`)
  }

  public reviewAndSubmit: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )

    return res.render('pages/adjustments/additional-days/review-and-submit', {
      model: await this.additionalDaysAwardedService.getReviewAndSubmitModel(
        req,
        prisonerDetail,
        startOfSentenceEnvelope,
        username,
        token,
      ),
    })
  }

  public submit: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    await this.additionalDaysAwardedService.submitAdjustments(
      req,
      prisonerDetail,
      startOfSentenceEnvelope,
      username,
      token,
    )

    const message = {
      action: 'ADDITIONAL_DAYS_UPDATED',
    } as Message
    return res.redirect(`/${nomsId}/success?message=${JSON.stringify(message)}`)
  }

  public addWarning: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    return res.render('pages/adjustments/additional-days/add-warning', {
      model: {
        prisonerDetail,
      },
    })
  }

  public view: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    const adas = await this.additionalDaysAwardedService.viewAdjustments(
      nomsId,
      startOfSentenceEnvelope,
      username,
      token,
    )

    return res.render('pages/adjustments/additional-days/view', {
      model: {
        prisonerDetail,
        adas,
      },
    })
  }
}

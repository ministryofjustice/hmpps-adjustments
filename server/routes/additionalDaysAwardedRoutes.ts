import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import { AdaIntercept, AdasToReview } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'
import { Message } from '../model/adjustmentsHubViewModel'
import ReviewAndSubmitAdaViewModel from '../model/reviewAndSubmitAdaViewModel'

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
      nomsId,
      startOfSentenceEnvelope,
      username,
      token,
    )

    return res.render('pages/adjustments/additional-days/review-and-approve', {
      model: {
        prisonerDetail,
      },
      adasToReview,
    })
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
    const adjustments = await this.additionalDaysAwardedService.getAdjustmentsToSubmit(
      prisonerDetail,
      startOfSentenceEnvelope,
      username,
      token,
    )

    return res.render('pages/adjustments/additional-days/review-and-submit', {
      model: new ReviewAndSubmitAdaViewModel(prisonerDetail, adjustments),
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
}

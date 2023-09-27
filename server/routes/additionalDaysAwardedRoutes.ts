import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import { AdaIntercept, AdasToReview } from '../@types/AdaTypes'
import AdjustmentsClient from '../api/adjustmentsClient'

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

    return res.render('pages/adjustments/ada/intercept', {
      model: {
        prisonerDetail,
        intercept,
      },
    })
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    const adasToReview: AdasToReview = await this.additionalDaysAwardedService.getAdasToReview(
      nomsId,
      startOfSentenceEnvelope,
      username,
      token,
    )

    return res.render('pages/adjustments/ada/review', {
      model: {
        prisonerDetail,
      },
      adasToReview,
    })
  }

  public approve: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    await this.additionalDaysAwardedService.approveAdjudications(
      req,
      prisonerDetail,
      startOfSentenceEnvelope,
      username,
      token,
    )

    return res.redirect(`/${nomsId}`)
  }
}

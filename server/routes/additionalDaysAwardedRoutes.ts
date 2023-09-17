import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdditionalDaysAwardedService from '../services/additionalDaysAwardedService'
import { AdasToReview } from '../@types/AdaTypes'

export default class AdditionalDaysAwardedRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly additionalDaysAwardedService: AdditionalDaysAwardedService,
  ) {}

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token, username } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const startOfSentenceEnvelope = await this.prisonerService.getStartOfSentenceEnvelope(
      prisonerDetail.bookingId,
      token,
    )
    const adaToReview: AdasToReview = await this.additionalDaysAwardedService.getAdjudications(
      nomsId,
      startOfSentenceEnvelope,
      username,
    )

    return res.render('pages/adjustments/ada/review', {
      model: {
        prisonerDetail,
      },
      adaToReview,
    })
  }
}

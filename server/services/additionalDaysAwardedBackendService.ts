import { Request } from 'express'
import { AdaIntercept, AdasToReview, AdasToView, PadasToReview } from '../@types/AdaTypes'
import PadaForm from '../model/padaForm'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import AdjustmentsService from './adjustmentsService'
import { Adjustment, AdasByDateCharged } from '../@types/adjustments/adjustmentsTypes'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'
import ReviewAndSubmitAdaViewModel from '../model/reviewAndSubmitAdaViewModel'
import AdaComparisonModel from '../model/adaComparisonModel'
import config from '../config'
import FullPageError from '../model/FullPageError'

export default class AdditionalDaysAwardedBackendService {
  constructor(
    private readonly adjustmentsService: AdjustmentsService,
    private readonly additionalDaysAwardedStoreService: AdditionalDaysAwardedStoreService,
  ) {}

  public async viewAdjustments(nomsId: string, token: string, activeCaseLoadId: string): Promise<AdasToView> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token, activeCaseLoadId)

    return {
      awarded: response.awarded,
      totalAwarded: response.totalAwarded,
    }
  }

  public async getAdasToApprove(
    req: Request,
    nomsId: string,
    token: string,
    activeCaseLoadId: string,
  ): Promise<AdasToReview> {
    const selected = this.additionalDaysAwardedStoreService.getSelectedPadas(req, nomsId)
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token, activeCaseLoadId, selected)

    return {
      awarded: response.awarded,
      totalAwarded: response.totalAwarded,
      awaitingApproval: response.awaitingApproval,
      totalAwaitingApproval: response.totalAwaitingApproval,
      suspended: response.suspended,
      totalSuspended: response.totalSuspended,
      quashed: response.quashed,
      totalQuashed: response.totalQuashed,
      intercept: response.intercept,
      totalExistingAdads: response.totalExistingAdas,
      showExistingAdaMessage: response.showExistingAdaMessage,
    }
  }

  public async getPadasToApprove(nomsId: string, token: string, activeCaseLoadId: string): Promise<PadasToReview> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token, activeCaseLoadId)

    return {
      prospective: response.prospective,
      totalProspective: response.totalProspective,
    }
  }

  public storeSelectedPadas(req: Request, nomsId: string, padaForm: PadaForm): void {
    this.additionalDaysAwardedStoreService.storeSelectedPadas(req, nomsId, padaForm.getSelectedProspectiveAdas())
  }

  public async shouldIntercept(nomsId: string, token: string, activeCaseLoadId: string): Promise<AdaIntercept> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token, activeCaseLoadId)
    return response.intercept
  }

  public async getReviewAndSubmitModel(
    req: Request,
    prisonerDetail: PrisonerSearchApiPrisoner,
    token: string,
    activeCaseLoadId: string,
  ): Promise<ReviewAndSubmitAdaViewModel> {
    const { adjustmentsToCreate, allAdaAdjustments, quashed } = await this.getAdasToSubmitAndDelete(
      req,
      prisonerDetail,
      token,
      activeCaseLoadId,
    )

    const quashedAdjustments = quashed.map(it => {
      return allAdaAdjustments.find(adjustment => this.adjustmentMatchesAdjudication(it, adjustment))
    })
    return new ReviewAndSubmitAdaViewModel(adjustmentsToCreate, allAdaAdjustments, quashedAdjustments)
  }

  public async submitAdjustments(
    req: Request,
    prisonerDetail: PrisonerSearchApiPrisoner,
    token: string,
    activeCaseLoadId: string,
  ) {
    const { awarded, adjustmentsToCreate, allAdaAdjustments, prospectiveRejected } =
      await this.getAdasToSubmitAndDelete(req, prisonerDetail, token, activeCaseLoadId)

    const awardedIds = awarded.map(it => it.adjustmentId)
    // Delete all ADAs which were not in the awarded table.
    await Promise.all(
      allAdaAdjustments
        .filter(it => awardedIds.indexOf(it.id) === -1)
        .map(it => {
          return this.adjustmentsService.delete(it.id, token)
        }),
    )
    if (adjustmentsToCreate.length) {
      // Create adjustments
      await this.adjustmentsService.create(adjustmentsToCreate, token)
    }

    await Promise.all(
      awarded
        .filter(it => it.adjustmentId)
        .map(it => {
          return this.adjustmentsService.update(
            it.adjustmentId,
            {
              id: it.adjustmentId,
              ...this.toAdjustment(prisonerDetail, it),
            },
            token,
          )
        }),
    )

    await Promise.all(
      prospectiveRejected.map(it => {
        return this.adjustmentsService.rejectProspectiveAda(
          prisonerDetail.prisonerNumber,
          {
            person: prisonerDetail.prisonerNumber,
            days: it.total,
            dateChargeProved: it.dateChargeProved,
          },
          token,
        )
      }),
    )
  }

  private adjustmentMatchesAdjudication(adjudication: AdasByDateCharged, adjustment: Adjustment): boolean {
    return (
      adjudication.total === adjustment.days &&
      adjudication.dateChargeProved === adjustment.fromDate &&
      JSON.stringify(adjudication.charges.map(charge => charge.chargeNumber).sort()) ===
        JSON.stringify(adjustment.additionalDaysAwarded.adjudicationId.sort())
    )
  }

  private async getAdasToSubmitAndDelete(
    req: Request,
    prisonerDetail: PrisonerSearchApiPrisoner,
    token: string,
    activeCaseLoadId: string,
  ): Promise<{
    adjustmentsToCreate: Adjustment[]
    awarded: AdasByDateCharged[]
    allAdaAdjustments: Adjustment[]
    quashed: AdasByDateCharged[]
    prospectiveRejected: AdasByDateCharged[]
  }> {
    const allAdaAdjustments = (
      await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(prisonerDetail.prisonerNumber, token)
    ).filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')

    const selected = this.additionalDaysAwardedStoreService.getSelectedPadas(req, prisonerDetail.prisonerNumber)
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(
      prisonerDetail.prisonerNumber,
      token,
      activeCaseLoadId,
      selected,
    )

    /* Rejected PADAs are not awarded or pending */
    const prospectiveRejected = response.prospective.filter(it => {
      const isAwarded = this.prospectiveAdjudicationMatches(it, response.awarded)
      const isPending = this.prospectiveAdjudicationMatches(it, response.awaitingApproval)
      return !isAwarded && !isPending
    })

    return {
      awarded: response.awarded,
      allAdaAdjustments,
      adjustmentsToCreate: response.awaitingApproval.map(it => this.toAdjustment(prisonerDetail, it)),
      quashed: response.quashed,
      prospectiveRejected,
    }
  }

  private prospectiveAdjudicationMatches(prospective: AdasByDateCharged, adas: AdasByDateCharged[]) {
    return adas.some(
      it => it.dateChargeProved === prospective.dateChargeProved && it.charges[0].status === 'PROSPECTIVE',
    )
  }

  private toAdjustment(prisonerDetail: PrisonerSearchApiPrisoner, it: AdasByDateCharged) {
    return {
      person: prisonerDetail.prisonerNumber,
      bookingId: parseInt(prisonerDetail.bookingId, 10),
      adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
      fromDate: it.dateChargeProved,
      days: it.total,
      prisonId: prisonerDetail.prisonId,
      additionalDaysAwarded: {
        adjudicationId: it.charges.map(charge => charge.chargeNumber),
        prospective: it.charges.some(charge => charge.status === 'PROSPECTIVE'),
      },
    } as Adjustment
  }

  public async comparisonViewModel(
    nomsId: string,
    activeCaseLoadId: string,
    reqService: string,
    token: string,
  ): Promise<AdaComparisonModel> {
    if (config.featureToggles.adaComparisonEnabled) {
      const service = reqService || config.featureToggles.defaultAdaApi
      const [prisonApiResponse, adjudicationsApiResponse] = await Promise.all([
        this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token, activeCaseLoadId, [], 'PRISON-API'),
        this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token, activeCaseLoadId, [], 'ADJUDICATIONS-API'),
      ])

      return new AdaComparisonModel(prisonApiResponse, adjudicationsApiResponse, service)
    }
    throw FullPageError.notFoundError()
  }
}

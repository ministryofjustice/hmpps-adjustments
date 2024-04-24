import { Request } from 'express'
import { AdaIntercept, AdasByDateCharged, AdasToReview, AdasToView, PadasToReview } from '../@types/AdaTypes'
import PadaForm from '../model/padaForm'
import AdditionalDaysAwardedStoreService from './additionalDaysApprovalStoreService'
import AdjustmentsService from './adjustmentsService'
import { Adjustment, AdasByDateCharged as AdasByDateChargedBackend } from '../@types/adjustments/adjustmentsTypes'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'
import ReviewAndSubmitAdaViewModel from '../model/reviewAndSubmitAdaViewModel'

export default class AdditionalDaysAwardedBackendService {
  constructor(
    private readonly adjustmentsService: AdjustmentsService,
    private readonly additionalDaysAwardedStoreService: AdditionalDaysAwardedStoreService,
  ) {}

  public async viewAdjustments(nomsId: string, token: string): Promise<AdasToView> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token)

    return {
      awarded: response.awarded as unknown as AdasByDateCharged[],
      totalAwarded: response.totalAwarded,
    }
  }

  public async getAdasToApprove(req: Request, nomsId: string, token: string): Promise<AdasToReview> {
    const selected = this.additionalDaysAwardedStoreService.getSelectedPadas(req, nomsId)
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token, selected)

    return {
      awarded: response.awarded as unknown as AdasByDateCharged[],
      totalAwarded: response.totalAwarded,
      awaitingApproval: response.awaitingApproval as unknown as AdasByDateCharged[],
      totalAwaitingApproval: response.totalAwaitingApproval,
      suspended: response.suspended as unknown as AdasByDateCharged[],
      totalSuspended: response.totalSuspended,
      quashed: response.quashed as unknown as AdasByDateCharged[],
      totalQuashed: response.totalQuashed,
      intercept: response.intercept,
      totalExistingAdads: response.totalExistingAdas,
      showExistingAdaMessage: response.showExistingAdaMessage,
    }
  }

  public async getPadasToApprove(nomsId: string, token: string): Promise<PadasToReview> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token)

    return {
      prospective: response.prospective as unknown as AdasByDateCharged[],
      totalProspective: response.totalProspective,
    }
  }

  public storeSelectedPadas(req: Request, nomsId: string, padaForm: PadaForm): void {
    this.additionalDaysAwardedStoreService.storeSelectedPadas(req, nomsId, padaForm.getSelectedProspectiveAdas())
  }

  public async shouldIntercept(nomsId: string, token: string): Promise<AdaIntercept> {
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(nomsId, token)
    return response.intercept
  }

  public async getReviewAndSubmitModel(
    req: Request,
    prisonerDetail: PrisonerSearchApiPrisoner,
    token: string,
  ): Promise<ReviewAndSubmitAdaViewModel> {
    const { adjustmentsToCreate, allAdaAdjustments, quashed } = await this.getAdasToSubmitAndDelete(
      req,
      prisonerDetail,
      token,
    )

    const quashedAdjustments = quashed.map(it => {
      return allAdaAdjustments.find(adjustment => this.adjustmentMatchesAdjudication(it, adjustment))
    })
    return new ReviewAndSubmitAdaViewModel(adjustmentsToCreate, allAdaAdjustments, quashedAdjustments)
  }

  public async submitAdjustments(req: Request, prisonerDetail: PrisonerSearchApiPrisoner, token: string) {
    const { awarded, adjustmentsToCreate, allAdaAdjustments } = await this.getAdasToSubmitAndDelete(
      req,
      prisonerDetail,
      token,
    )

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
      })

    this.additionalDaysAwardedStoreService.setLastApprovedDate(req, prisonerDetail.prisonerNumber)
    this.additionalDaysAwardedStoreService.clearSelectedPadas(req, prisonerDetail.prisonerNumber)
  }

  private adjustmentMatchesAdjudication(adjudication: AdasByDateChargedBackend, adjustment: Adjustment): boolean {
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
  ): Promise<{
    adjustmentsToCreate: Adjustment[]
    awarded: AdasByDateChargedBackend[]
    allAdaAdjustments: Adjustment[]
    quashed: AdasByDateChargedBackend[]
  }> {
    const allAdaAdjustments = (
      await this.adjustmentsService.findByPersonOutsideSentenceEnvelope(prisonerDetail.prisonerNumber, token)
    ).filter(it => it.adjustmentType === 'ADDITIONAL_DAYS_AWARDED')

    const selected = this.additionalDaysAwardedStoreService.getSelectedPadas(req, prisonerDetail.prisonerNumber)
    const response = await this.adjustmentsService.getAdaAdjudicationDetails(
      prisonerDetail.prisonerNumber,
      token,
      selected,
    )

    return {
      awarded: response.awarded,
      allAdaAdjustments,
      adjustmentsToCreate: response.awaitingApproval.map(it => this.toAdjustment(prisonerDetail, it)),
      quashed: response.quashed,
    }
  }

  private toAdjustment(prisonerDetail: PrisonerSearchApiPrisoner, it: AdasByDateChargedBackend) {
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
}

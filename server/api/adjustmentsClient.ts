import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import {
  AdaAdjudicationDetails,
  Adjustment,
  AdjustmentStatus,
  CreateResponse,
  ManualUnusedDeduction,
  ProspectiveAdaRejection,
  RestoreAdjustments,
  UnusedDeductionsCalculationResult,
  ValidationMessage,
} from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Adjustments API', config.apis.adjustments as ApiConfig, token)
  }

  async get(adjustmentsId: string): Promise<Adjustment> {
    return this.restClient.get({ path: `/adjustments/${adjustmentsId}` }) as Promise<Adjustment>
  }

  async setUnusedDaysManually(person: string, manualUnusedDeduction: ManualUnusedDeduction) {
    return this.restClient.post({
      path: `/adjustments/person/${person}/manual-unused-deductions`,
      data: manualUnusedDeduction,
    })
  }

  async getUnusedDeductionsCalculationResult(person: string): Promise<UnusedDeductionsCalculationResult> {
    return this.restClient.get({
      path: `/adjustments/person/${person}/unused-deductions-result`,
    }) as Promise<UnusedDeductionsCalculationResult>
  }

  async findByPerson(person: string, earliestSentenceDate?: string): Promise<Adjustment[]> {
    let url = `/adjustments?person=${person}`
    if (earliestSentenceDate) {
      url += `&sentenceEnvelopeDate=${earliestSentenceDate}`
    }
    return this.restClient.get({
      path: url,
    }) as Promise<Adjustment[]>
  }

  async findByPersonAndStatus(person: string, status: AdjustmentStatus): Promise<Adjustment[]> {
    return this.restClient.get({ path: `/adjustments?person=${person}&status=${status}` }) as Promise<Adjustment[]>
  }

  async create(adjustments: Adjustment[]): Promise<CreateResponse> {
    return this.restClient.post({ path: `/adjustments`, data: adjustments }) as Promise<CreateResponse>
  }

  async update(adjustmentsId: string, adjustment: Adjustment): Promise<void> {
    return this.restClient.put({ path: `/adjustments/${adjustmentsId}`, data: adjustment }) as Promise<void>
  }

  async delete(adjustmentsId: string): Promise<void> {
    return this.restClient.delete({ path: `/adjustments/${adjustmentsId}` }) as Promise<void>
  }

  async validate(adjustment: Adjustment): Promise<ValidationMessage[]> {
    return this.restClient.post({ path: `/adjustments/validate`, data: adjustment }) as Promise<ValidationMessage[]>
  }

  async restore(adjustment: RestoreAdjustments): Promise<void> {
    return this.restClient.post({ path: `/adjustments/restore`, data: adjustment }) as Promise<void>
  }

  async getAdaAdjudicationDetails(
    person: string,
    selectedPadas: string[],
    activeCaseLoadId: string,
  ): Promise<AdaAdjudicationDetails> {
    return this.restClient.get({
      path: `/adjustments/additional-days/${person}/adjudication-details?selectedProspectiveAdaDates=${selectedPadas.join(',')}`,
      headers: { 'Active-Caseload': activeCaseLoadId },
    }) as Promise<AdaAdjudicationDetails>
  }

  async rejectProspectiveAda(person: string, prospectiveAdaRejection: ProspectiveAdaRejection) {
    return this.restClient.post({
      path: `/adjustments/additional-days/${person}/reject-prospective-ada`,
      data: prospectiveAdaRejection,
    })
  }
}

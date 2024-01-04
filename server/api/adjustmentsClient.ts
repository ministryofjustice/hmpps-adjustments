import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import {
  Adjustment,
  AdjustmentStatus,
  CreateResponse,
  RestoreAdjustments,
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

  async findByPerson(person: string): Promise<Adjustment[]> {
    return this.restClient.get({ path: `/adjustments?person=${person}` }) as Promise<Adjustment[]>
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
}

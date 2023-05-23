import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import { Adjustment, AdjustmentDetails, CreateResponse } from '../@types/adjustments/adjustmentsTypes'

export default class AdjustmentsClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Adjustments API', config.apis.adjustments as ApiConfig, token)
  }

  async get(adjustmentsId: string): Promise<AdjustmentDetails> {
    return this.restClient.get({ path: `/adjustments/${adjustmentsId}` }) as Promise<AdjustmentDetails>
  }

  async findByPerson(person: string): Promise<Adjustment[]> {
    return this.restClient.get({ path: `/adjustments?person=${person}` }) as Promise<Adjustment[]>
  }

  async findByPersonAndSource(person: string, source: 'DPS' | 'NOMIS'): Promise<Adjustment[]> {
    return this.restClient.get({ path: `/adjustments?person=${person}&source=${source}` }) as Promise<Adjustment[]>
  }

  async create(adjustment: AdjustmentDetails): Promise<CreateResponse> {
    return this.restClient.post({ path: `/adjustments`, data: adjustment }) as Promise<CreateResponse>
  }

  async update(adjustmentsId: string, adjustment: AdjustmentDetails): Promise<void> {
    return this.restClient.put({ path: `/adjustments/${adjustmentsId}`, data: adjustment }) as Promise<void>
  }

  async delete(adjustmentsId: string): Promise<void> {
    return this.restClient.delete({ path: `/adjustments/${adjustmentsId}` }) as Promise<void>
  }
}

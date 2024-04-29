import { Request } from 'express'

export default class AdditionalDaysAwardedStoreService {
  public storeSelectedPadas(req: Request, nomsId: string, padas: string[]): void {
    if (!req.session.additionalDayPadas) {
      req.session.additionalDayPadas = {}
    }
    req.session.additionalDayPadas[nomsId] = padas
  }

  public getSelectedPadas(req: Request, nomsId: string): string[] {
    if (!req.session.additionalDayPadas) {
      req.session.additionalDayPadas = {}
    }
    return req.session.additionalDayPadas[nomsId] || []
  }

  public clearSelectedPadas(req: Request, nomsId: string): void {
    if (!req.session.additionalDayPadas) {
      req.session.additionalDayPadas = {}
    }
    req.session.additionalDayPadas[nomsId] = []
  }
}

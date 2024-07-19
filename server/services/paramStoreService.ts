import { Request } from 'express'

export default class ParamStoreService {
  public get(req: Request, key: string): boolean {
    return req.session.params[key]
  }

  public store(req: Request, key: string, value: boolean) {
    if (!req.session.params) {
      req.session.params = {}
    }

    req.session.params[key] = value
  }

  public clear(req: Request, key: string) {
    delete req.session.params[key]
  }

  public clearAll(req: Request) {
    req.session.params = {}
  }
}

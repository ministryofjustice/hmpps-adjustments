import type { RequestHandler } from 'express'

export default function supportUserReadonlyMiddleware(): RequestHandler {
  return async (req, res, next) => {
    if (res.locals.user.isSupportUser) {
      return res.redirect('/authError')
    }
    return next()
  }
}

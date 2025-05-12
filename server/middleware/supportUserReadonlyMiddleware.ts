import type { RequestHandler } from 'express'
import logger from '../../logger'

export default function supportUserReadonlyMiddleware(): RequestHandler {
  return async (req, res, next) => {
    if (res.locals.user.isSupportUser) {
      logger.info('The signed in user is a support user, redirecting to authError')
      return res.redirect('/authError')
    }
    return next()
  }
}

import type { RequestHandler } from 'express'
import logger from '../../logger'
import config from '../config'

export default function supportUserReadonlyMiddleware(): RequestHandler {
  return async (req, res, next) => {
    if (res.locals.user.isSupportUser && config.blockSupportUsersFromEdit) {
      logger.info('The signed in user is a support user, redirecting to authError')
      return res.redirect('/authError')
    }
    return next()
  }
}

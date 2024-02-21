import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import FullPageError from '../model/FullPageError'
import logger from '../../logger'

export default function populateCurrentPrisoner(prisonerService: PrisonerService): RequestHandler {
  return async (req, res, next) => {
    const { token, caseloads } = res.locals.user
    const { nomsId } = req.params

    if (token && nomsId) {
      try {
        const prisoner = await prisonerService.getPrisonerDetail(nomsId, caseloads, token)
        if (caseloads.includes(prisoner.agencyId)) {
          res.locals.prisoner = prisoner
        } else {
          throw FullPageError.notInCaseLoadError()
        }
      } catch (error) {
        logger.error(error, `Failed to get prisoner with prisoner number: ${nomsId}`)
        return next(error)
      }
    }

    return next()
  }
}

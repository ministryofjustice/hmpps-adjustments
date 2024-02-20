import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerSearchService from '../services/prisonerSearchService'
import FullPageError from '../model/FullPageError'

export default function getPrisoner(prisonerSearchService: PrisonerSearchService): RequestHandler {
  return async (req, res, next) => {
    const { username, caseloads } = res.locals.user
    const { nomsId } = req.params

    if (username && nomsId) {
      try {
        const prisoner = await prisonerSearchService.getByPrisonerNumber(username, nomsId)
        if (caseloads.includes(prisoner.prisonId)) {
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

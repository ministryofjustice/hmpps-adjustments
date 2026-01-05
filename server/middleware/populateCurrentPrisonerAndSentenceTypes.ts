import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerSearchService from '../services/prisonerSearchService'
import { UserDetails } from '../services/userService'
import RemandAndSentencingService from '../services/remandAndSentencingService'

export default function populateCurrentPrisonerAndSentenceTypes(
  prisonerSearchService: PrisonerSearchService,
  remandAndSentencingService: RemandAndSentencingService,
): RequestHandler {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    if (username && nomsId) {
      try {
        // Fetch prisoner details
        const prisoner = await prisonerSearchService.getPrisonerDetails(nomsId, res.locals.user as UserDetails)
        res.locals.prisoner = prisoner

        // Fetch sentence types and details
        await remandAndSentencingService.getSentenceTypeAndItsDetails(username)
      } catch (error) {
        logger.error(error, `Failed to get prisoner with prisoner number: ${nomsId}`)
        return next(error)
      }
    }

    return next()
  }
}

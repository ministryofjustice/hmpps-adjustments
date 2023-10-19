import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import FullPageErrorType from './FullPageErrorType'

class FullPageError extends Error {
  errorKey: FullPageErrorType

  status: number

  static notInCaseLoadError(): FullPageError {
    const error = new FullPageError('Prisoner is in caseload')
    error.errorKey = FullPageErrorType.NOT_IN_CASELOAD
    error.status = 404
    return error
  }

  static notFoundError(): FullPageError {
    const error = new FullPageError('Not found')
    error.errorKey = FullPageErrorType.NOT_FOUND
    error.status = 404
    return error
  }

  static noSentences(): FullPageError {
    const error = new FullPageError('Prisoner has no sentences')
    error.errorKey = FullPageErrorType.NO_SENTENCES
    error.status = 400
    return error
  }
}

export default FullPageError

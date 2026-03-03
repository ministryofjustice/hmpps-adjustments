import { Message } from '../model/adjustmentsHubViewModel'

export default class ReviewPreviousUalUrls {
  static home(nomsId: string): string {
    return `/${nomsId}`
  }

  static reviewPreviousPeriods(nomsId: string) {
    return `/${nomsId}/review-previous-unlawfully-at-large-periods`
  }

  static reviewUalToApply(nomsId: string) {
    return `/${nomsId}/review-unlawfully-at-large-to-apply`
  }

  static confirmRejectPreviousPeriods(nomsId: string) {
    return `/${nomsId}/confirm-inapplicable-unlawfully-at-large-periods`
  }

  static success(nomsId: string, message: Message): string {
    return `/${nomsId}/success?message=${JSON.stringify(message)}`
  }

  static cancel(nomsId: string): string {
    return `/${nomsId}/cancel-review-previous-unlawfully-at-large-periods`
  }
}

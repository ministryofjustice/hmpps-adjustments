import { RequestHandler } from 'express'
import PreviousUnlawfullyAtLargeReviewStoreService from '../services/previousUnlawfullyAtLargeReviewStoreService'
import ReviewPreviousUalForm from '../model/reviewPreviousUalForm'
import ReviewPreviousUalUrls from './reviewPreviousUalUrls'
import {
  PreviousUnlawfullyAtLargeAdjustmentForReview,
  PreviousUnlawfullyAtLargeReviewRequest,
} from '../@types/adjustments/adjustmentsTypes'
import AdjustmentsService from '../services/adjustmentsService'
import { Message } from '../model/adjustmentsHubViewModel'
import ConfirmRejectPreviousPeriodsOfUalForm from '../model/confirmRejectPreviousPeriodsOfUalForm'

export default class ReviewPreviousUalRoutes {
  constructor(
    private readonly adjustmentsService: AdjustmentsService,
    private readonly previousUnlawfullyAtLargeReviewStoreService: PreviousUnlawfullyAtLargeReviewStoreService,
  ) {}

  public reviewPreviousUal: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const previousUalAdjustmentsForReview =
      await this.adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview(nomsId, username)

    if (!previousUalAdjustmentsForReview?.length) {
      return res.redirect(ReviewPreviousUalUrls.home(nomsId))
    }

    return res.render('pages/adjustments/unlawfully-at-large/review-previous-periods', {
      previousUalAdjustmentsForReview,
      form: new ReviewPreviousUalForm({}),
      backLink: ReviewPreviousUalUrls.home(nomsId),
      cancelLink: ReviewPreviousUalUrls.cancel(nomsId),
    })
  }

  public submitReviewPreviousUal: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const reviewPreviousUalForm = new ReviewPreviousUalForm(req.body)
    await reviewPreviousUalForm.validate()

    if (reviewPreviousUalForm.errors?.length) {
      const previousUalAdjustmentsForReview =
        await this.adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview(nomsId, username)

      return res.render('pages/adjustments/unlawfully-at-large/review-previous-periods', {
        previousUalAdjustmentsForReview,
        form: reviewPreviousUalForm,
        backLink: ReviewPreviousUalUrls.home(nomsId),
        cancelLink: ReviewPreviousUalUrls.cancel(nomsId),
      })
    }
    this.previousUnlawfullyAtLargeReviewStoreService.storeReview(req, nomsId, reviewPreviousUalForm.toRequest())
    if (reviewPreviousUalForm.isNoneSelected()) {
      return res.redirect(ReviewPreviousUalUrls.confirmRejectPreviousPeriods(nomsId))
    }
    return res.redirect(ReviewPreviousUalUrls.reviewUalToApply(nomsId))
  }

  public reviewUalToApply: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const previousUalAdjustmentsForReview =
      await this.adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview(nomsId, username)

    if (!previousUalAdjustmentsForReview?.length) {
      return res.redirect(ReviewPreviousUalUrls.home(nomsId))
    }

    const inProgressReview = this.previousUnlawfullyAtLargeReviewStoreService.getReview(req, nomsId)
    if (
      inProgressReview.acceptedAdjustmentIds.length === 0 ||
      this.itemsForReviewHasChanged(inProgressReview, previousUalAdjustmentsForReview)
    ) {
      return res.redirect(ReviewPreviousUalUrls.reviewPreviousPeriods(nomsId))
    }

    return res.render('pages/adjustments/unlawfully-at-large/review-previous-periods-to-apply', {
      previousUalAdjustmentsForReview: previousUalAdjustmentsForReview.filter(it =>
        inProgressReview.acceptedAdjustmentIds.includes(it.id),
      ),
      backLink: ReviewPreviousUalUrls.reviewPreviousPeriods(nomsId),
      cancelLink: ReviewPreviousUalUrls.cancel(nomsId),
    })
  }

  public submitReviewUalToApply: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const reviewToSave = this.previousUnlawfullyAtLargeReviewStoreService.getReview(req, nomsId)
    const previousUal = await this.adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview(nomsId, username)
    const numberOfDaysUalToBeCreated = previousUal
      .filter(it => reviewToSave.acceptedAdjustmentIds.includes(it.id))
      .map(it => it.days)
      .reduce((sum, current) => sum + current, 0)

    await this.adjustmentsService
      .submitPreviousUnlawfullyAtLargeReviewRequest(nomsId, reviewToSave, username)
      .then(() => this.previousUnlawfullyAtLargeReviewStoreService.clearReview(req, nomsId))
    const message = {
      type: 'UNLAWFULLY_AT_LARGE',
      action: 'CREATE',
      days: numberOfDaysUalToBeCreated,
    } as Message
    return res.redirect(ReviewPreviousUalUrls.success(nomsId, message))
  }

  public viewConfirmRejectAllUal: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const previousUalAdjustmentsForReview =
      await this.adjustmentsService.getPreviousUnlawfullyAtLargeAdjustmentForReview(nomsId, username)

    if (!previousUalAdjustmentsForReview?.length) {
      return res.redirect(ReviewPreviousUalUrls.home(nomsId))
    }

    const inProgressReview = this.previousUnlawfullyAtLargeReviewStoreService.getReview(req, nomsId)
    if (
      inProgressReview.rejectedAdjustmentIds.length === 0 ||
      this.itemsForReviewHasChanged(inProgressReview, previousUalAdjustmentsForReview)
    ) {
      return res.redirect(ReviewPreviousUalUrls.reviewPreviousPeriods(nomsId))
    }

    return res.render('pages/adjustments/unlawfully-at-large/confirm-reject-previous-periods', {
      form: new ConfirmRejectPreviousPeriodsOfUalForm({}),
      backLink: ReviewPreviousUalUrls.reviewPreviousPeriods(nomsId),
      cancelLink: ReviewPreviousUalUrls.cancel(nomsId),
    })
  }

  public submitConfirmRejectAllUal: RequestHandler = async (req, res): Promise<void> => {
    const { username } = res.locals.user
    const { nomsId } = req.params

    const confirmRejectPreviousPeriodsOfUalForm = new ConfirmRejectPreviousPeriodsOfUalForm(req.body)
    await confirmRejectPreviousPeriodsOfUalForm.validate()

    if (confirmRejectPreviousPeriodsOfUalForm.errors?.length) {
      return res.render('pages/adjustments/unlawfully-at-large/confirm-reject-previous-periods', {
        backLink: ReviewPreviousUalUrls.reviewPreviousPeriods(nomsId),
        cancelLink: ReviewPreviousUalUrls.cancel(nomsId),
        form: confirmRejectPreviousPeriodsOfUalForm,
      })
    }
    if (confirmRejectPreviousPeriodsOfUalForm.confirm === 'no') {
      return res.redirect(ReviewPreviousUalUrls.reviewPreviousPeriods(nomsId))
    }
    const reviewToSubmit = this.previousUnlawfullyAtLargeReviewStoreService.getReview(req, nomsId)
    await this.adjustmentsService
      .submitPreviousUnlawfullyAtLargeReviewRequest(nomsId, reviewToSubmit, username)
      .then(() => this.previousUnlawfullyAtLargeReviewStoreService.clearReview(req, nomsId))
    return res.redirect(ReviewPreviousUalUrls.home(nomsId))
  }

  public cancel: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    this.previousUnlawfullyAtLargeReviewStoreService.clearReview(req, nomsId)
    return res.redirect(ReviewPreviousUalUrls.home(nomsId))
  }

  private itemsForReviewHasChanged(
    inProgressReview: PreviousUnlawfullyAtLargeReviewRequest,
    previousUalAdjustmentsForReview: PreviousUnlawfullyAtLargeAdjustmentForReview[],
  ) {
    return (
      inProgressReview.acceptedAdjustmentIds.length + inProgressReview.rejectedAdjustmentIds.length !==
        previousUalAdjustmentsForReview.length ||
      !previousUalAdjustmentsForReview.every(
        forReview =>
          inProgressReview.acceptedAdjustmentIds.includes(forReview.id) ||
          inProgressReview.rejectedAdjustmentIds.includes(forReview.id),
      )
    )
  }
}

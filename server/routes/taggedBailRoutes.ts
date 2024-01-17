import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import TaggedBailSelectCaseModel from '../model/taggedBailSelectCaseModel'
import TaggedBailDaysModel from '../model/taggedBailDaysModel'
import RemandDatesForm from '../model/remandDatesForm'
import RemandDatesModel from '../model/remandDatesModel'
import TaggedBailDaysForm from '../model/taggedBailDaysForm'
import TaggedBailReviewModel from '../model/taggedBailReviewModel'

export default class TaggedBailRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
  ) {}

  public add: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    const sessionId = this.adjustmentsStoreService.store(req, nomsId, null, {
      adjustmentType: 'TAGGED_BAIL',
      bookingId: prisonerDetail.bookingId,
      person: nomsId,
      prisonId: prisonerDetail.agencyId,
    })

    return res.redirect(`/${nomsId}/tagged-bail/select-case/add/${sessionId}`)
  }

  public selectCase: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)

    return res.render('pages/adjustments/tagged-bail/select-case', {
      model: new TaggedBailSelectCaseModel(prisonerDetail, sentencesAndOffences, addOrEdit, id),
    })
  }

  public days: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const { caseSequence } = req.query as Record<string, string>
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    this.adjustmentsStoreService.store(req, nomsId, id, {
      ...adjustment,
      taggedBail: { caseSequence: caseSequence as unknown as number },
    })
    const form = TaggedBailDaysForm.fromAdjustment(adjustment)

    return res.render('pages/adjustments/tagged-bail/days', {
      model: new TaggedBailDaysModel(prisonerDetail, addOrEdit, id, form),
    })
  }

  public submitDays: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new TaggedBailDaysForm({ ...req.body, isEdit: addOrEdit === 'edit', adjustmentId: id })
    await adjustmentForm.validate()
    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/tagged-bail/days', {
        model: new TaggedBailDaysModel(prisonerDetail, addOrEdit, id, adjustmentForm),
      })
    }

    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    this.adjustmentsStoreService.store(req, nomsId, id, adjustmentForm.toAdjustment(adjustment))

    return res.redirect(`/${nomsId}/tagged-bail/review/${addOrEdit}/${id}`)
  }

  public review: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, addOrEdit, id } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustment = this.adjustmentsStoreService.getById(req, nomsId, id)
    const sentencesAndOffences = await this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token)

    return res.render('pages/adjustments/tagged-bail/review', {
      model: new TaggedBailReviewModel(prisonerDetail, addOrEdit, id, sentencesAndOffences, adjustment),
    })
  }
}

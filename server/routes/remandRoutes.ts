import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'
import AdjustmentsService from '../services/adjustmentsService'
import AdjustmentsStoreService from '../services/adjustmentsStoreService'
import adjustmentTypes from '../model/adjustmentTypes'
import FullPageError from '../model/FullPageError'
import RemandDatesForm from '../model/remandDatesForm'

export default class RemandRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly adjustmentsService: AdjustmentsService,
    private readonly adjustmentsStoreService: AdjustmentsStoreService,
  ) {}

  public dates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentTypeUrl, addOrEdit, id } = req.params

    if (!['edit', 'add'].includes(addOrEdit)) {
      throw FullPageError.notFoundError()
    }

    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)

    let adjustment = null
    if (addOrEdit === 'edit') {
      const sessionAdjustment = this.adjustmentsStoreService.get(req, nomsId)
      if (id && sessionAdjustment?.id !== id) {
        adjustment = await this.adjustmentsService.get(id, token)
      } else {
        adjustment = sessionAdjustment
      }
    }
    const form = adjustment ? RemandDatesForm.fromAdjustment(adjustment) : new RemandDatesForm({})

    return res.render('pages/adjustments/remand/dates', {
      model: { prisonerDetail, form, addOrEdit, id },
    })
  }

  public submitDates: RequestHandler = async (req, res): Promise<void> => {
    const { caseloads, token } = res.locals.user
    const { nomsId, adjustmentTypeUrl, addOrEdit, id } = req.params

    const adjustmentType = adjustmentTypes.find(it => it.url === adjustmentTypeUrl)
    if (!adjustmentType) {
      return res.redirect(`/${nomsId}`)
    }

    const prisonerDetail = await this.prisonerService.getPrisonerDetail(nomsId, caseloads, token)
    const adjustmentForm = new RemandDatesForm(req.body)

    await adjustmentForm.validate(() => this.prisonerService.getSentencesAndOffences(prisonerDetail.bookingId, token))

    if (adjustmentForm.errors.length) {
      return res.render('pages/adjustments/remand/dates', {
        model: { prisonerDetail, form: adjustmentForm, addOrEdit, id },
      })
    }

    // const messages = await this.adjustmentsService.validate(adjustment, token)

    // const validationMessages = messages.filter(it => it.type === 'VALIDATION')

    // if (validationMessages.length) {
    //   adjustmentForm.addErrors(validationMessages)
    //   return res.render('pages/adjustments/form', {
    //     model: { prisonerDetail, form: adjustmentForm, addOrEdit, id },
    //   })
    // }
    return res.redirect(`/${nomsId}/remand/offences/${addOrEdit}`)
  }
}

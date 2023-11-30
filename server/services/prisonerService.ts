import type HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiAdjudication,
  PrisonApiAdjudicationSearchResponse,
  PrisonApiAdjustment,
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiCharge,
  PrisonApiCourtCase,
  PrisonApiCourtDateResult,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
  PrisonApiSentence,
} from '../@types/prisonApi/prisonClientTypes'
import FullPageError from '../model/FullPageError'

export default class PrisonerService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getPrisonerDetailIncludingReleased(
    nomsId: string,
    userCaseloads: string[],
    token: string,
  ): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, true)
  }

  async getPrisonerDetail(nomsId: string, userCaseloads: string[], token: string): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, false)
  }

  async getAdjudications(nomsId: string, token: string): Promise<PrisonApiAdjudicationSearchResponse> {
    return new PrisonApiClient(token).getAdjudications(nomsId)
  }

  async getAdjudication(nomsId: string, adjudicationNumber: number, token: string): Promise<PrisonApiAdjudication> {
    return new PrisonApiClient(token).getAdjudication(nomsId, adjudicationNumber)
  }

  async getSentencesAndOffences(bookingId: number, token: string): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    const sentencesAndOffences = (await new PrisonApiClient(token).getSentencesAndOffences(bookingId)).filter(
      it => it.sentenceStatus === 'A',
    )
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences()
    }
    return sentencesAndOffences
  }

  private async getPrisonerDetailImpl(
    nomsId: string,
    userCaseloads: string[],
    token: string,
    includeReleased: boolean,
  ): Promise<PrisonApiPrisoner> {
    try {
      const prisonerDetail = await new PrisonApiClient(token).getPrisonerDetail(nomsId)
      if (userCaseloads.includes(prisonerDetail.agencyId) || (includeReleased && prisonerDetail.agencyId === 'OUT')) {
        return prisonerDetail
      }
      throw FullPageError.notInCaseLoadError()
    } catch (error) {
      if (error?.status === 404) {
        throw FullPageError.notInCaseLoadError()
      } else {
        throw error
      }
    }
  }

  public async createCourtCase(bookingId: number, courtCase: PrisonApiCourtCase, token: string): Promise<number> {
    return new PrisonApiClient(token).createCourtCase(bookingId, courtCase)
  }

  public async createCharge(bookingId: number, courtCase: PrisonApiCharge, token: string): Promise<number> {
    return new PrisonApiClient(token).createCharge(bookingId, courtCase)
  }

  public async createSentence(bookingId: number, courtCase: PrisonApiSentence, token: string): Promise<number> {
    return new PrisonApiClient(token).createSentence(bookingId, courtCase)
  }

  public async createAdjustment(bookingId: number, adjustment: PrisonApiAdjustment, token: string): Promise<number> {
    return new PrisonApiClient(token).createAdjustment(bookingId, adjustment)
  }

  public async getCourtDateResults(nomsId: string, token: string): Promise<PrisonApiCourtDateResult[]> {
    return new PrisonApiClient(token).getCourtDateResults(nomsId)
  }

  async getBookingAndSentenceAdjustments(
    bookingId: number,
    token: string,
  ): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return new PrisonApiClient(token).getBookingAndSentenceAdjustments(bookingId)
  }

  async getStartOfSentenceEnvelopeExcludingRecalls(bookingId: number, token: string): Promise<Date> {
    return this.findStartOfSentenceEvelope(
      (await this.getSentencesAndOffences(bookingId, token)).filter(
        it => !this.recallTypes.includes(it.sentenceCalculationType),
      ),
    )
  }

  private findStartOfSentenceEvelope(sentences: PrisonApiOffenderSentenceAndOffences[]): Date {
    if (sentences.length) {
      return new Date(
        Math.min.apply(
          null,
          sentences.filter(it => it.sentenceStatus === 'A').map(it => new Date(it.sentenceDate)),
        ),
      )
    }
    return null
  }

  private recallTypes = [
    'LR_EDS18',
    'LR_EDS21',
    'LR_EDSU18',
    'LR_LASPO_AR',
    'LR_LASPO_DR',
    'LR_SEC236A',
    'LR_SOPC18',
    'LR_SOPC21',
    '14FTR_ORA',
    'FTR',
    'FTR_ORA',
    'FTR_SCH15',
    'FTRSCH15_ORA',
    'FTRSCH18',
    'FTRSCH18_ORA',
    '14FTRHDC_ORA',
  ]
}

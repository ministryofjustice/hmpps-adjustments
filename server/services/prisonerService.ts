import { Readable } from 'stream'
import type HmppsAuthClient from '../data/hmppsAuthClient'
import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiCourtDateResult,
  PrisonApiOffence,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiPrisoner,
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

  async getPrisonerImage(token: string, prisonerNumber: string): Promise<Readable> {
    return new PrisonApiClient(token).getPrisonerImage(prisonerNumber)
  }

  async getPrisonerDetail(nomsId: string, userCaseloads: string[], token: string): Promise<PrisonApiPrisoner> {
    return this.getPrisonerDetailImpl(nomsId, userCaseloads, token, false)
  }

  async getSentencesAndOffencesFilteredForRemand(
    bookingId: number,
    token: string,
  ): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return (await this.getSentencesAndOffences(bookingId, token))
      .map(it => {
        return { ...it, offences: it.offences.filter(off => !this.aFineCantHaveRemand(it, off)) }
      })
      .filter(it => {
        return (
          it.offences.length &&
          !this.dtoCantHaveRemand(it) &&
          !this.sentenceTypeCantHaveRemand(it.sentenceCalculationType)
        )
      })
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

  private sentenceTypeCantHaveRemand(sentenceType: string) {
    return ['BOTUS', 'CIVIL'].includes(sentenceType)
  }

  private dtoCantHaveRemand(sentence: PrisonApiOffenderSentenceAndOffences) {
    return (
      ['DTO', 'DTO_ORA'].includes(sentence.sentenceCalculationType) &&
      new Date('2022-06-28') > new Date(sentence.sentenceDate)
    )
  }

  private aFineCantHaveRemand(sentence: PrisonApiOffenderSentenceAndOffences, offence: PrisonApiOffence) {
    return sentence.sentenceCalculationType === 'A/FINE' && offence.offenceStatute === 'ZZ01'
  }

  private recallTypes = [
    'LR',
    'LR_ORA',
    'LR_YOI_ORA',
    'LR_SEC91_ORA',
    'LRSEC250_ORA',
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

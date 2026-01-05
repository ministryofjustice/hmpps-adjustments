import { Readable } from 'stream'
import PrisonApiClient from '../api/prisonApiClient'
import {
  PrisonApiBookingAndSentenceAdjustments,
  PrisonApiCourtDateResult,
  PrisonApiOffence,
  PrisonApiOffenderSentenceAndOffences,
  PrisonApiUserCaseloads,
} from '../@types/prisonApi/prisonClientTypes'
import FullPageError from '../model/FullPageError'
import { HmppsAuthClient } from '../data'
import RemandAndSentencingService from './remandAndSentencingService'

export default class PrisonerService {
  constructor(
    private readonly hmppsAuthClient: HmppsAuthClient,
    private remandAndSentencingService: RemandAndSentencingService,
  ) {}

  async getSentencesAndOffencesFilteredForRemand(
    bookingId: string,
    username: string,
  ): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    return (await this.getSentencesAndOffences(bookingId, username))
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

  async getSentencesAndOffences(bookingId: string, username: string): Promise<PrisonApiOffenderSentenceAndOffences[]> {
    const sentencesAndOffences = (
      await new PrisonApiClient(await this.getSystemClientToken(username)).getSentencesAndOffences(bookingId)
    ).filter(it => it.sentenceStatus === 'A')
    if (sentencesAndOffences.length === 0) {
      throw FullPageError.noSentences()
    }
    return sentencesAndOffences
  }

  public async getCourtDateResults(nomsId: string, username: string): Promise<PrisonApiCourtDateResult[]> {
    return new PrisonApiClient(await this.getSystemClientToken(username)).getCourtDateResults(nomsId)
  }

  async getUsersCaseloads(userToken: string): Promise<PrisonApiUserCaseloads[]> {
    return new PrisonApiClient(userToken).getUsersCaseloads()
  }

  async getBookingAndSentenceAdjustments(
    bookingId: number,
    username: string,
  ): Promise<PrisonApiBookingAndSentenceAdjustments> {
    return new PrisonApiClient(await this.getSystemClientToken(username)).getBookingAndSentenceAdjustments(bookingId)
  }

  async getStartOfSentenceEnvelope(
    bookingId: string,
    username: string,
  ): Promise<{
    earliestExcludingRecalls: Date
    earliestSentence: Date
    sentencesAndOffences: PrisonApiOffenderSentenceAndOffences[]
  }> {
    const sentencesAndOffences = await this.getSentencesAndOffences(bookingId, username)
    return {
      earliestExcludingRecalls: this.findStartOfSentenceEvelope(
        sentencesAndOffences.filter(
          it => !this.remandAndSentencingService.isSentenceRecalled(it.sentenceCalculationType),
        ),
      ),
      earliestSentence: this.findStartOfSentenceEvelope(sentencesAndOffences),
      sentencesAndOffences,
    }
  }

  async getPrisonerImage(username: string, prisonerNumber: string): Promise<Readable> {
    return new PrisonApiClient(await this.getSystemClientToken(username)).getPrisonerImage(prisonerNumber)
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

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}

export default class AdjudicationModel {
  constructor(
    public adjudicationNumber: number,
    public reportNumber: number,
    public days: number,
    public hearingDate: string,
    public sanctionSeq: number,
    public consecutiveSanctionSeq: number,
  ) {}
}

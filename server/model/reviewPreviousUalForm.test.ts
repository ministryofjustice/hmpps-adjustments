import ReviewPreviousUalForm from './reviewPreviousUalForm'

describe('reviewPreviousUalForm', () => {
  describe('validation', () => {
    it('should fail validation if form was empty', async () => {
      const form = new ReviewPreviousUalForm({})
      expect(await form.validation()).toStrictEqual([
        {
          fields: ['selectedUalPeriod'],
          text: 'Select the UAL that applies to the release date calculation',
        },
      ])
    })
    it('should fail validation if nothing was selected', async () => {
      const form = new ReviewPreviousUalForm({ selectedUalPeriod: [] })
      expect(await form.validation()).toStrictEqual([
        {
          fields: ['selectedUalPeriod'],
          text: 'Select the UAL that applies to the release date calculation',
        },
      ])
    })
    it('should fail validation if none and a period was selected', async () => {
      const form = new ReviewPreviousUalForm({ selectedUalPeriod: ['none', 'abc123'] })
      expect(await form.validation()).toStrictEqual([
        {
          fields: ['selectedUalPeriod'],
          text: 'Select the UAL that applies to the release date calculation or select ‘No previous periods of UAL apply’',
        },
      ])
    })
    it('should pass validation if none selected', async () => {
      const form = new ReviewPreviousUalForm({ selectedUalPeriod: ['none'] })
      expect(await form.validation()).toStrictEqual([])
      expect(form.isNoneSelected()).toStrictEqual(true)
    })
    it('should pass validation if none passed as not array by express', async () => {
      const form = new ReviewPreviousUalForm({ selectedUalPeriod: 'none' } as unknown)
      expect(await form.validation()).toStrictEqual([])
      expect(form.isNoneSelected()).toStrictEqual(true)
    })
    it('should pass validation if a period selected', async () => {
      const form = new ReviewPreviousUalForm({ selectedUalPeriod: ['abc123'] })
      expect(await form.validation()).toStrictEqual([])
      expect(form.isNoneSelected()).toStrictEqual(false)
    })
    it('should pass validation if a period selected but passed as a single value by express', async () => {
      const form = new ReviewPreviousUalForm({ selectedUalPeriod: 'abc123' } as unknown)
      expect(await form.validation()).toStrictEqual([])
      expect(form.isNoneSelected()).toStrictEqual(false)
    })
  })
  describe('toRequest', () => {
    it('should split into accepted and rejected ids when some periods were selected', () => {
      const form = new ReviewPreviousUalForm({
        selectedUalPeriod: ['selected1', 'selected2'],
        reviewedUalPeriod: ['selected2', 'notSelected', 'selected1'],
      })
      expect(form.toRequest()).toStrictEqual({
        acceptedAdjustmentIds: ['selected1', 'selected2'],
        rejectedAdjustmentIds: ['notSelected'],
      })
    })
    it('should handle express passing as single values reject', () => {
      const form = new ReviewPreviousUalForm({
        selectedUalPeriod: 'none',
        reviewedUalPeriod: 'notSelected',
      } as unknown)
      expect(form.toRequest()).toStrictEqual({
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['notSelected'],
      })
    })
    it('should handle express passing as single values accept', () => {
      const form = new ReviewPreviousUalForm({
        selectedUalPeriod: 'selected',
        reviewedUalPeriod: 'selected',
      } as unknown)
      expect(form.toRequest()).toStrictEqual({
        acceptedAdjustmentIds: ['selected'],
        rejectedAdjustmentIds: [],
      })
    })
    it('should include empty rejected ids when all periods were selected', () => {
      const form = new ReviewPreviousUalForm({
        selectedUalPeriod: ['selected1', 'selected2'],
        reviewedUalPeriod: ['selected2', 'selected1'],
      })
      expect(form.toRequest()).toStrictEqual({
        acceptedAdjustmentIds: ['selected1', 'selected2'],
        rejectedAdjustmentIds: [],
      })
    })
    it('should put everything in rejected when none is selected', () => {
      const form = new ReviewPreviousUalForm({
        selectedUalPeriod: ['none'],
        reviewedUalPeriod: ['id1', 'id2', 'id3'],
      })
      expect(form.toRequest()).toStrictEqual({
        acceptedAdjustmentIds: [],
        rejectedAdjustmentIds: ['id1', 'id2', 'id3'],
      })
    })
  })
})

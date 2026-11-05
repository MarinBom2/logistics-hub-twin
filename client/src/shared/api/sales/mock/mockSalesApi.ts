import { fail, save, store, wait } from '../../mock/mockStore'
import type { RoiInput, SalesApi } from '../salesService'

/** application.yml pricing.hub-monthly-fee 와 같은 값 */
const HUB_MONTHLY_FEE = 2_900_000

/** 서버 RoiEstimator 와 같은 식 (mock 전용 사본, 원 단위 내림). 식을 바꾸면 서버를 먼저 고친다 */
function estimate(input: RoiInput) {
  const emptyPercent = Math.max(0, input.targetLoadPercent - input.lowLoadAverageLoadPercent)
  const lowLoad = Math.floor(
    (input.hubCount * input.departuresPerHubPerDay * input.operatingDaysPerMonth * input.lowLoadDeparturePercent * input.tripCostWon * emptyPercent) /
      10_000,
  )
  const jam = Math.floor((input.hubCount * input.jamMinutesPerHubPerDay * input.crewPerHub * input.hourlyWageWon * input.operatingDaysPerMonth) / 60)
  const loss = lowLoad + jam
  const saving = Math.floor((loss * input.improvementPercent) / 100)
  const fee = input.hubCount * HUB_MONTHLY_FEE
  return {
    monthlyLowLoadLossWon: lowLoad,
    monthlyJamLossWon: jam,
    monthlyLossWon: loss,
    monthlySavingWon: saving,
    annualSavingWon: saving * 12,
    monthlyFeeWon: fee,
    netMonthlyBenefitWon: saving - fee,
    roiMultiple: fee === 0 ? null : Math.floor((saving / fee) * 10) / 10,
  }
}

export const mockSalesApi: SalesApi = {
  estimateRoi: async (input) => wait(estimate(input)),
  createLead: async (request) => {
    if (!request.agreePrivacy) fail(400, 'INVALID_REQUEST_DATA', '개인정보 수집·이용에 동의해 주세요.')
    store.leads += 1
    save()
    return wait({ leadId: store.leads })
  },
}

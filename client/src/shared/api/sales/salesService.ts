import { apiRequest } from '../../core/apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'mock'

/** 서버 RoiEstimateRequest (FR-SL-001). 모르는 값은 화면이 기본값(가정)을 채운다 */
export interface RoiInput {
  hubCount: number
  departuresPerHubPerDay: number
  operatingDaysPerMonth: number
  lowLoadDeparturePercent: number
  lowLoadAverageLoadPercent: number
  targetLoadPercent: number
  tripCostWon: number
  jamMinutesPerHubPerDay: number
  crewPerHub: number
  hourlyWageWon: number
  improvementPercent: number
}

/** 서버 RoiEstimate (원, 월 기준) */
export interface RoiEstimate {
  monthlyLowLoadLossWon: number
  monthlyJamLossWon: number
  monthlyLossWon: number
  monthlySavingWon: number
  annualSavingWon: number
  monthlyFeeWon: number
  netMonthlyBenefitWon: number
  /** 월 절감액 ÷ 월 구독료. 구독료가 0 이면 null */
  roiMultiple: number | null
}

/** 서버 LeadCreateRequest (FR-SL-002) */
export interface LeadCreateRequest {
  companyName: string
  contactName: string
  email: string
  hubCount: number
  message: string
  agreePrivacy: boolean
}

export interface SalesApi {
  estimateRoi: (input: RoiInput, signal?: AbortSignal) => Promise<RoiEstimate>
  /** 접수 번호만 돌아온다 */
  createLead: (request: LeadCreateRequest) => Promise<{ leadId: number }>
}

const httpSalesApi: SalesApi = {
  estimateRoi: (input, signal) =>
    apiRequest<RoiEstimate>('/api/v1/roi/estimates', { method: 'POST', auth: false, body: JSON.stringify(input), signal }),
  createLead: (request) =>
    apiRequest<{ leadId: number }>('/api/v1/leads', { method: 'POST', auth: false, body: JSON.stringify(request) }),
}

const load: () => Promise<SalesApi> = USE_MOCK
  ? () => import('./mock/mockSalesApi').then((module) => module.mockSalesApi)
  : () => Promise.resolve(httpSalesApi)

export const salesApi: SalesApi = {
  estimateRoi: (input, signal) => load().then((api) => api.estimateRoi(input, signal)),
  createLead: (request) => load().then((api) => api.createLead(request)),
}

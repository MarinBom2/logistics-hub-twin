import { apiRequest } from '../../core/apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'mock'

/** 서버 CenterResponse */
export interface CenterProfile {
  centerId: number
  code: string
  name: string
  region: string
}

/** 서버 CenterCreateRequest (FR-CT-001) */
export interface CenterCreateRequest {
  code: string
  name: string
  region: string
}

export interface CenterApi {
  /** 내 고객사 센터만 코드 순으로 */
  list: () => Promise<CenterProfile[]>
  /** 관리자만. 같은 코드면 ALREADY_EXIST */
  register: (request: CenterCreateRequest) => Promise<CenterProfile>
}

const httpCenterApi: CenterApi = {
  list: () => apiRequest<CenterProfile[]>('/api/v1/centers'),
  register: (request) => apiRequest<CenterProfile>('/api/v1/centers', { method: 'POST', body: JSON.stringify(request) }),
}

const load: () => Promise<CenterApi> = USE_MOCK
  ? () => import('./mock/mockCenterApi').then((module) => module.mockCenterApi)
  : () => Promise.resolve(httpCenterApi)

export const centerApi: CenterApi = {
  list: () => load().then((api) => api.list()),
  register: (request) => load().then((api) => api.register(request)),
}

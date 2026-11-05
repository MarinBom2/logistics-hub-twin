import { apiRequest } from '../../core/apiClient'
import type { CodeLabel } from '../../types/common'

// 이 판별식은 파일마다 직접 둔다. 공통 모듈로 빼면 운영 빌드에서 mock 분기가 지워지지 않는다
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'mock'

export type RoleCode = 'VIEWER' | 'OPERATOR' | 'ADMIN'

/** 서버 MemberResponse */
export interface MemberProfile {
  memberId: number
  organizationId: number
  email: string
  /** VIEWER(조회) · OPERATOR(운영자) · ADMIN(관리자) */
  roleType: CodeLabel<RoleCode>
}

export interface MemberApi {
  /** 세션 확인에도 쓴다. 만료 안내를 띄우면 안 되면 auth: false */
  me: (options?: { auth?: boolean }) => Promise<MemberProfile>
}

const httpMemberApi: MemberApi = {
  me: (options = {}) => apiRequest<MemberProfile>('/api/v1/me', options),
}

const load: () => Promise<MemberApi> = USE_MOCK
  ? () => import('../auth/mock/mockAuthApi').then((module) => module.mockMemberApi)
  : () => Promise.resolve(httpMemberApi)

export const memberApi: MemberApi = {
  me: (options) => load().then((api) => api.me(options)),
}

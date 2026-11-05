import { apiRequest } from '../../core/apiClient'
import type { CodeLabel } from '../../types/common'
import type { MemberProfile, RoleCode } from '../member/memberService'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'mock'

/** 서버 OrganizationResponse */
export interface OrganizationProfile {
  organizationId: number
  name: string
  planType: CodeLabel<'PILOT' | 'HUB' | 'NETWORK'>
  /** 파일럿 종료 시각 (ISO, UTC) */
  pilotEndsAt: string | null
}

/** 서버 TeamMemberCreateRequest (FR-OR-002) */
export interface TeamMemberCreateRequest {
  email: string
  password: string
  roleType: RoleCode
}

export interface OrganizationApi {
  get: () => Promise<OrganizationProfile>
  /** 관리자만. 아니면 ApiError.code === 'FORBIDDEN' */
  members: () => Promise<MemberProfile[]>
  addMember: (request: TeamMemberCreateRequest) => Promise<MemberProfile>
}

const httpOrganizationApi: OrganizationApi = {
  get: () => apiRequest<OrganizationProfile>('/api/v1/organization'),
  members: () => apiRequest<MemberProfile[]>('/api/v1/organization/members'),
  addMember: (request) =>
    apiRequest<MemberProfile>('/api/v1/organization/members', { method: 'POST', body: JSON.stringify(request) }),
}

const load: () => Promise<OrganizationApi> = USE_MOCK
  ? () => import('./mock/mockOrganizationApi').then((module) => module.mockOrganizationApi)
  : () => Promise.resolve(httpOrganizationApi)

export const organizationApi: OrganizationApi = {
  get: () => load().then((api) => api.get()),
  members: () => load().then((api) => api.members()),
  addMember: (request) => load().then((api) => api.addMember(request)),
}

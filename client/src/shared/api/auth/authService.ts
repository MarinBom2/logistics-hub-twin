import { apiRequest } from '../../core/apiClient'
import type { MemberProfile } from '../member/memberService'

// 이 판별식은 파일마다 직접 둔다. 공통 모듈로 빼면 운영 빌드에서 mock 분기가 지워지지 않는다
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'mock'

/** 서버 MemberAuthenticationAPIFilter 가 읽는 키 그대로 (POST /api/v1/auth/login) */
export interface MemberLoginRequest {
  email: string
  password: string
}

/** 서버 MemberSignupRequest (FR-AU-001). 가입 = 워크스페이스 만들기. 비밀번호는 8~20자, 영문·숫자 포함 */
export interface MemberSignupRequest {
  organizationName: string
  email: string
  password: string
}

export interface AuthApi {
  /** 성공하면 인증 쿠키(HttpOnly)가 붙고 본문은 회원 정보. 실패는 ApiError.code === 'LOGIN_FAILED' */
  login: (request: MemberLoginRequest) => Promise<MemberProfile>
  /** 워크스페이스(파일럿)와 관리자 계정을 만든다. 로그인은 따로 부른다. 이미 있으면 ALREADY_EXIST */
  signup: (request: MemberSignupRequest) => Promise<MemberProfile>
  /** 이 계정으로 발급한 토큰을 전부 무효로 만들고 쿠키를 지운다 (204) */
  logout: () => Promise<void>
}

const httpAuthApi: AuthApi = {
  login: (request) =>
    apiRequest<MemberProfile>('/api/v1/auth/login', { method: 'POST', auth: false, body: JSON.stringify(request) }),
  signup: (request) =>
    apiRequest<MemberProfile>('/api/v1/auth/signup', { method: 'POST', auth: false, body: JSON.stringify(request) }),
  logout: () => apiRequest<void>('/api/v1/auth/logout', { method: 'POST', auth: false }),
}

const load: () => Promise<AuthApi> = USE_MOCK
  ? () => import('./mock/mockAuthApi').then((module) => module.mockAuthApi)
  : () => Promise.resolve(httpAuthApi)

export const authApi: AuthApi = {
  login: (request) => load().then((api) => api.login(request)),
  signup: (request) => load().then((api) => api.signup(request)),
  logout: () => load().then((api) => api.logout()),
}

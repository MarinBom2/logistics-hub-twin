import { ApiError } from '../../../core/apiClient'
import type { MemberProfile } from '../../member/memberService'
import type { MemberApi } from '../../member/memberService'
import type { AuthApi } from '../authService'

/*
 * 서버 없이 화면을 볼 때 쓰는 가짜 인증 (npm run dev:mock). 계정과 세션은 이 브라우저의 localStorage 에만 있다.
 * 미리 만든 계정: operator@example.com / Passw0rd!
 */

interface Account {
  memberId: number
  email: string
  password: string
  role: 'VIEWER' | 'OPERATOR' | 'ADMIN'
}

interface MockState {
  accounts: Account[]
  sessionMemberId: number | null
}

const STORAGE_KEY = 'lht-mock-auth'
const ROLE_LABEL = { VIEWER: '조회', OPERATOR: '운영자', ADMIN: '관리자' } as const

const initial: MockState = {
  accounts: [{ memberId: 1, email: 'operator@example.com', password: 'Passw0rd!', role: 'OPERATOR' }],
  sessionMemberId: null,
}

let state: MockState = read()

function read(): MockState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as MockState) : initial
  } catch {
    return initial
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 저장소를 못 쓰면 이번 탭에서만 유지된다
  }
}

const wait = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250))

function fail(status: number, code: string, detail: string): never {
  throw new ApiError(detail, status, { status, code, detail })
}

const normalize = (email: string) => email.trim().toLowerCase()

function profile(account: Account): MemberProfile {
  return { memberId: account.memberId, email: account.email, roleType: { code: account.role, description: ROLE_LABEL[account.role] } }
}

export const mockAuthApi: AuthApi = {
  login: async ({ email, password }) => {
    const account = state.accounts.find((item) => item.email === normalize(email) && item.password === password)
    if (!account) fail(401, 'LOGIN_FAILED', '아이디 또는 비밀번호가 일치하지 않습니다.')
    state = { ...state, sessionMemberId: account.memberId }
    save()
    return wait(profile(account))
  },

  signup: async ({ email, password }) => {
    const normalized = normalize(email)
    if (state.accounts.some((account) => account.email === normalized)) fail(409, 'ALREADY_EXIST', '이미 가입된 이메일입니다.')
    const account: Account = {
      memberId: Math.max(...state.accounts.map((item) => item.memberId)) + 1,
      email: normalized,
      password,
      role: 'VIEWER',
    }
    state = { ...state, accounts: [...state.accounts, account] }
    save()
    return wait(profile(account))
  },

  logout: async () => {
    state = { ...state, sessionMemberId: null }
    save()
    await wait(undefined)
  },
}

export const mockMemberApi: MemberApi = {
  me: async () => {
    const account = state.accounts.find((item) => item.memberId === state.sessionMemberId)
    if (!account) fail(401, 'UNAUTHORIZED', '로그인이 필요합니다.')
    return wait(profile(account))
  },
}

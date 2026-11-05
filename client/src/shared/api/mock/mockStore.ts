import { ApiError } from '../../core/apiClient'

/*
 * 서버 없이 화면을 볼 때 쓰는 가짜 저장소 (npm run dev:mock). 이 브라우저의 localStorage 에만 있다.
 * 서비스별 mock(auth·organization·center·sales)이 이 상태 하나를 같이 쓴다.
 * 미리 만든 계정: admin@example.com / Passw0rd! (관리자), operator@example.com / Passw0rd! (운영자)
 */

export type MockRole = 'VIEWER' | 'OPERATOR' | 'ADMIN'

export interface MockAccount {
  memberId: number
  organizationId: number
  email: string
  password: string
  role: MockRole
}

export interface MockOrganization {
  organizationId: number
  name: string
  pilotEndsAt: string
}

export interface MockCenter {
  centerId: number
  organizationId: number
  code: string
  name: string
  region: string
}

interface MockState {
  organizations: MockOrganization[]
  accounts: MockAccount[]
  centers: MockCenter[]
  leads: number
  sessionMemberId: number | null
}

const STORAGE_KEY = 'lht-mock-store-v2'
const PILOT_DAYS = 56
export const ROLE_LABEL: Record<MockRole, string> = { VIEWER: '조회', OPERATOR: '운영자', ADMIN: '관리자' }

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString()

function initial(): MockState {
  return {
    organizations: [{ organizationId: 1, name: '데모물류', pilotEndsAt: daysFromNow(41) }],
    accounts: [
      { memberId: 1, organizationId: 1, email: 'admin@example.com', password: 'Passw0rd!', role: 'ADMIN' },
      { memberId: 2, organizationId: 1, email: 'operator@example.com', password: 'Passw0rd!', role: 'OPERATOR' },
    ],
    centers: [
      { centerId: 1, organizationId: 1, code: 'HUB-IC', name: '이천 센터', region: '경기 남부' },
      { centerId: 2, organizationId: 1, code: 'HUB-Y3', name: '용인 3센터', region: '경기 남부' },
    ],
    leads: 0,
    sessionMemberId: null,
  }
}

function read(): MockState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as MockState) : initial()
  } catch {
    return initial()
  }
}

/** 상태는 이 객체 하나를 고쳐 쓰고 save() 로 남긴다 */
export const store: MockState = read()

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // 저장소를 못 쓰면 이번 탭에서만 유지된다
  }
}

export const wait = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250))

export function fail(status: number, code: string, detail: string): never {
  throw new ApiError(detail, status, { status, code, detail })
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

const nextId = (ids: number[]) => (ids.length ? Math.max(...ids) : 0) + 1

/** 로그인한 계정. 없으면 서버처럼 401 */
export function currentAccount(): MockAccount {
  const account = store.accounts.find((item) => item.memberId === store.sessionMemberId)
  if (!account) fail(401, 'UNAUTHORIZED', '로그인이 필요합니다.')
  return account
}

/** 서버 SecurityConfig 와 같은 규칙: 관리자 전용 */
export function requireAdmin(): MockAccount {
  const account = currentAccount()
  if (account.role !== 'ADMIN') fail(403, 'FORBIDDEN', '요청할 권한이 없습니다.')
  return account
}

export function createAccount(organizationId: number, email: string, password: string, role: MockRole): MockAccount {
  const normalized = normalizeEmail(email)
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,20}$/.test(password)) {
    fail(400, 'INVALID_REQUEST_DATA', '비밀번호는 8~20자로, 영문과 숫자를 함께 넣어 주세요.')
  }
  if (store.accounts.some((item) => item.email === normalized)) fail(409, 'ALREADY_EXIST', '이미 가입된 이메일입니다.')
  const account = { memberId: nextId(store.accounts.map((item) => item.memberId)), organizationId, email: normalized, password, role }
  store.accounts.push(account)
  save()
  return account
}

export function createOrganization(name: string): MockOrganization {
  const organization = {
    organizationId: nextId(store.organizations.map((item) => item.organizationId)),
    name: name.trim(),
    pilotEndsAt: daysFromNow(PILOT_DAYS),
  }
  store.organizations.push(organization)
  save()
  return organization
}

export function createCenter(organizationId: number, code: string, name: string, region: string): MockCenter {
  const normalized = code.trim().toUpperCase()
  if (store.centers.some((item) => item.organizationId === organizationId && item.code === normalized)) {
    fail(409, 'ALREADY_EXIST', '이미 등록된 센터 코드입니다.')
  }
  const center = { centerId: nextId(store.centers.map((item) => item.centerId)), organizationId, code: normalized, name: name.trim(), region: region.trim() }
  store.centers.push(center)
  save()
  return center
}

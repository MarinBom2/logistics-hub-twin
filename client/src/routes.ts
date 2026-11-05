/** 화면 ID(SCR-xx)별 경로. 서버 SpaForwardController 가 같은 경로를 index.html 로 돌린다 */
export const ROUTES = {
  /** SCR-00 영업 랜딩: 제품 소개, 라이브 데모, 투자 효과 계산기, 가격, 도입 문의 */
  SCR00_LANDING: '/',
  /** SCR-01 데모 관제: 시뮬레이션 데이터로 도는 관제 화면 (로그인 없이) */
  SCR01_DEMO: '/demo/centers/:centerId',
  /** SCR-02 로그인·워크스페이스 만들기 (?next=, ?mode=signup) */
  SCR02_LOGIN: '/login',
  /** SCR-03 워크스페이스: 파일럿 상태, 센터, 팀원 */
  SCR03_WORKSPACE: '/workspace',
} as const

/** 랜딩 페이지 안 구역 (머리글 메뉴) */
export const SECTIONS = {
  product: 'product',
  roi: 'roi',
  pilot: 'pilot',
  pricing: 'pricing',
  contact: 'contact',
} as const

export const demoPath = (centerId: string) => `/demo/centers/${centerId}`
export const loginPath = (next: string) => `/login?next=${encodeURIComponent(next)}`
export const signupPath = () => `/login?mode=signup&next=${encodeURIComponent(ROUTES.SCR03_WORKSPACE)}`
export const sectionPath = (id: string) => `/#${id}`

/** 로그인 뒤 돌아갈 경로. 같은 사이트 경로만 받는다 (//evil.com 같은 값 차단). 없으면 워크스페이스 */
export function safeNext(search: URLSearchParams) {
  const next = search.get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : ROUTES.SCR03_WORKSPACE
}

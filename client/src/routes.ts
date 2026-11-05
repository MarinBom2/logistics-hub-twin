/** 화면 ID(SCR-xx)별 경로. 서버 SpaForwardController 가 같은 경로를 index.html 로 돌린다 */
export const ROUTES = {
  /** SCR-01 관제: 센터 네트워크 + 선택 센터 KPI·3D·도크·이벤트 */
  SCR01_DASHBOARD: '/centers/:centerId',
  /** SCR-02 로그인·가입 (?next=, ?mode=signup) */
  SCR02_LOGIN: '/login',
} as const

export const dashboardPath = (centerId: string) => `/centers/${centerId}`
export const loginPath = (next: string) => `/login?next=${encodeURIComponent(next)}`

/** 로그인 뒤 돌아갈 경로. 같은 사이트 경로만 받는다 (//evil.com 같은 값 차단) */
export function safeNext(search: URLSearchParams) {
  const next = search.get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

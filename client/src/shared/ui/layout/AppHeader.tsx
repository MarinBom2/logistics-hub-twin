import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CENTER_CONFIGS } from '../../../features/twin/sim/centers'
import { ROUTES, SECTIONS, demoPath, loginPath, sectionPath } from '../../../routes'
import { useAuth } from '../../auth/useAuth'

const NAV = [
  { label: '제품', to: sectionPath(SECTIONS.product) },
  { label: '효과 계산', to: sectionPath(SECTIONS.roi) },
  { label: '도입 방식', to: sectionPath(SECTIONS.pilot) },
  { label: '가격', to: sectionPath(SECTIONS.pricing) },
  { label: '라이브 데모', to: demoPath(CENTER_CONFIGS[0].id) },
]

/** 모든 화면 위의 머리글: 제품 메뉴, 로그인 상태, 도입 문의 */
export function AppHeader() {
  const { status, member, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const onLoginPage = location.pathname === ROUTES.SCR02_LOGIN

  return (
    <header className="app-header">
      <div className="inner">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" />
          Hub Twin
          <small>상하차 관제 디지털 트윈</small>
        </Link>
        <nav className="nav" aria-label="제품 메뉴">
          {NAV.map((item) => (
            <Link key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="who">
          {status === 'authenticated' && member ? (
            <>
              <Link to={ROUTES.SCR03_WORKSPACE} className="btn ghost">
                워크스페이스
              </Link>
              <span className="email">{member.email}</span>
              <button type="button" className="btn ghost" onClick={() => void logout().then(() => navigate('/'))}>
                로그아웃
              </button>
            </>
          ) : status === 'anonymous' && !onLoginPage ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate(loginPath(location.pathname === '/' ? ROUTES.SCR03_WORKSPACE : location.pathname))}
            >
              로그인
            </button>
          ) : null}
          <Link to={sectionPath(SECTIONS.contact)} className="btn primary small">
            도입 문의
          </Link>
        </div>
      </div>
    </header>
  )
}

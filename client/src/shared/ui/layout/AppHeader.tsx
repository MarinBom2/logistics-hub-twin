import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES, loginPath } from '../../../routes'
import { useAuth } from '../../auth/useAuth'

/** 모든 화면 위의 머리글: 이름과 로그인 상태. 관제 화면은 로그인 없이 본다 */
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
          허브 디지털 트윈
          <small>LOGISTICS HUB TWIN</small>
        </Link>
        <div className="who">
          {status === 'authenticated' && member ? (
            <>
              <span className="email">{member.email}</span>
              <span className="chip paused">{member.roleType.description}</span>
              <button type="button" className="btn ghost" onClick={() => void logout()}>
                로그아웃
              </button>
            </>
          ) : status === 'anonymous' && !onLoginPage ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate(loginPath(location.pathname + location.search))}
            >
              로그인
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

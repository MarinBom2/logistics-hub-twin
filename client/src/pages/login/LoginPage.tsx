import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { safeNext } from '../../routes'
import { authApi } from '../../shared/api/auth/authService'
import { useAuth } from '../../shared/auth/useAuth'
import { errorMessage } from '../../shared/utils/common/errorMessage'
import './login.css'

type Mode = 'login' | 'signup'

/**
 * SCR-02 로그인·워크스페이스 만들기 (FR-AU-001, FR-AU-002).
 * 가입하면 회사 워크스페이스가 8주 파일럿으로 열리고 가입한 사람이 관리자가 된다. 팀원은 관리자가 발급한다.
 */
export default function LoginPage() {
  const [search, setSearch] = useSearchParams()
  const navigate = useNavigate()
  const { status, login, expiredReason, clearExpiredReason } = useAuth()
  const mode: Mode = search.get('mode') === 'signup' ? 'signup' : 'login'
  const next = safeNext(search)

  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'authenticated') return <Navigate to={next} replace />

  const switchMode = (target: Mode) => {
    const params = new URLSearchParams(search)
    if (target === 'signup') params.set('mode', 'signup')
    else params.delete('mode')
    setSearch(params, { replace: true })
    setError(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    clearExpiredReason()
    try {
      if (mode === 'signup') {
        await authApi.signup({ organizationName, email, password })
        await login({ email, password })
        navigate(next, { replace: true })
      } else {
        await login({ email, password })
        navigate(next, { replace: true })
      }
    } catch (caught) {
      setError(errorMessage(caught, mode === 'signup' ? '가입하지 못했습니다.' : '로그인하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="wrap login-wrap">
      <form className="card login-card" onSubmit={submit} noValidate>
        <h1>{mode === 'signup' ? '워크스페이스 만들기' : '로그인'}</h1>
        <p className="lead">
          {mode === 'signup'
            ? '회사 워크스페이스가 8주 파일럿으로 열리고, 만든 분이 관리자가 됩니다. 팀원 계정은 워크스페이스에서 발급해요.'
            : '고객사 워크스페이스에 들어갑니다. 계정은 회사 관리자가 발급합니다.'}
        </p>
        {expiredReason && <p className="form-error">{expiredReason}</p>}
        {mode === 'signup' && (
          <div className="field">
            <label htmlFor="organizationName">회사명</label>
            <input
              id="organizationName"
              autoComplete="organization"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              required
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">업무 이메일</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {mode === 'signup' && <span className="help">8~20자, 영문과 숫자를 함께 넣어 주세요.</span>}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn primary" disabled={busy || !email || !password || (mode === 'signup' && !organizationName)}>
          {busy ? '처리 중…' : mode === 'signup' ? '파일럿 시작하기' : '로그인'}
        </button>
        <button type="button" className="btn ghost switch" onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? '이미 계정이 있어요' : '처음이에요 · 워크스페이스 만들기'}
        </button>
      </form>
    </div>
  )
}

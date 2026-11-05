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
 * SCR-02 로그인·가입 (FR-AU-001, FR-AU-002). 관제 조회는 로그인 없이 되고,
 * 로그인은 제어 명령(운영자 이상)을 쓸 때 필요하다 (md/authentication-security.md).
 */
export default function LoginPage() {
  const [search, setSearch] = useSearchParams()
  const navigate = useNavigate()
  const { status, login, expiredReason, clearExpiredReason } = useAuth()
  const mode: Mode = search.get('mode') === 'signup' ? 'signup' : 'login'
  const next = safeNext(search)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'authenticated') return <Navigate to={next} replace />

  const switchMode = (target: Mode) => {
    const params = new URLSearchParams(search)
    if (target === 'signup') params.set('mode', 'signup')
    else params.delete('mode')
    setSearch(params, { replace: true })
    setError(null)
    setNotice(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    clearExpiredReason()
    try {
      if (mode === 'signup') {
        await authApi.signup({ email, password })
        switchMode('login')
        setNotice('가입했어요. 이제 로그인해 주세요. 처음에는 조회 권한으로 시작합니다.')
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
        <h1>{mode === 'signup' ? '가입' : '로그인'}</h1>
        <p className="lead">
          {mode === 'signup'
            ? '이메일로 가입하면 조회 권한으로 시작해요. 제어 권한은 관리자가 올려 줍니다.'
            : '관제 화면은 로그인 없이 볼 수 있어요. 제어 명령은 운영자 권한이 필요합니다.'}
        </p>
        {expiredReason && <p className="form-error">{expiredReason}</p>}
        {notice && <p className="form-notice">{notice}</p>}
        <div className="field">
          <label htmlFor="email">이메일</label>
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
        <button type="submit" className="btn primary" disabled={busy || !email || !password}>
          {busy ? '처리 중…' : mode === 'signup' ? '가입하기' : '로그인'}
        </button>
        <button type="button" className="btn ghost switch" onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? '이미 계정이 있어요' : '처음이에요 · 가입하기'}
        </button>
      </form>
    </div>
  )
}

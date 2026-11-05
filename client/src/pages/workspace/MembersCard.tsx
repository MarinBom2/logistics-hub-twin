import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { MemberProfile, RoleCode } from '../../shared/api/member/memberService'
import { organizationApi } from '../../shared/api/organization/organizationService'
import { errorMessage } from '../../shared/utils/common/errorMessage'

const ROLE_OPTIONS: { code: RoleCode; label: string; hint: string }[] = [
  { code: 'VIEWER', label: '조회', hint: '관제 화면만 봅니다 (센터장·본사)' },
  { code: 'OPERATOR', label: '운영자', hint: '유입량·집게차 대수 같은 제어 명령을 보냅니다 (현장 관리자)' },
  { code: 'ADMIN', label: '관리자', hint: '센터 등록과 팀원 관리까지 합니다' },
]

const EMPTY = { email: '', password: '', roleType: 'OPERATOR' as RoleCode }

/** 팀원 계정 발급 (FR-OR-002). 관리자에게만 보인다 */
export function MembersCard() {
  const [members, setMembers] = useState<MemberProfile[] | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    organizationApi
      .members()
      .then(setMembers)
      .catch((caught) => setError(errorMessage(caught, '팀원을 불러오지 못했습니다.')))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await organizationApi.addMember(form)
      setMembers((prev) => [...(prev ?? []), created])
      setForm(EMPTY)
    } catch (caught) {
      setError(errorMessage(caught, '계정을 만들지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2>
        팀원 <span>{members ? `${members.length}명` : ''}</span>
      </h2>
      {members && (
        <table className="table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>권한</th>
            </tr>
          </thead>
          <tbody>
            {members.map((item) => (
              <tr key={item.memberId}>
                <td>{item.email}</td>
                <td>{item.roleType.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form className="ws-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="member-email">업무 이메일</label>
          <input id="member-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="member-password">초기 비밀번호</label>
          <input
            id="member-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="member-role">권한</label>
          <select id="member-role" value={form.roleType} onChange={(e) => setForm({ ...form, roleType: e.target.value as RoleCode })}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn primary" disabled={busy || !form.email || !form.password}>
          계정 발급
        </button>
      </form>
      <p className="ws-muted">{ROLE_OPTIONS.find((option) => option.code === form.roleType)?.hint}</p>
      {error && <p className="form-error">{error}</p>}
    </section>
  )
}

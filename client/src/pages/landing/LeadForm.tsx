import { useState } from 'react'
import type { FormEvent } from 'react'
import { salesApi } from '../../shared/api/sales/salesService'
import { errorMessage } from '../../shared/utils/common/errorMessage'

const EMPTY = { companyName: '', contactName: '', email: '', hubCount: 1, message: '', agreePrivacy: false }

/** SCR-00 도입 문의 (FR-SL-002). 접수 번호만 받는다 */
export function LeadForm() {
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadId, setLeadId] = useState<number | null>(null)

  const update = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((prev) => ({ ...prev, [key]: value }))
  const ready = form.companyName && form.contactName && form.email && form.hubCount >= 1 && form.agreePrivacy

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { leadId: received } = await salesApi.createLead(form)
      setLeadId(received)
      setForm(EMPTY)
    } catch (caught) {
      setError(errorMessage(caught, '문의를 보내지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  if (leadId !== null) {
    return (
      <div className="card lead-done" role="status">
        <h3>문의를 받았습니다 (접수 번호 {leadId})</h3>
        <p>파일럿 범위와 일정을 정리해 남겨 주신 이메일로 연락드리겠습니다.</p>
        <button type="button" className="btn ghost" onClick={() => setLeadId(null)}>
          다른 문의 남기기
        </button>
      </div>
    )
  }

  return (
    <form className="card lead-form" onSubmit={submit} noValidate>
      <div className="lead-grid">
        <div className="field">
          <label htmlFor="lead-company">회사명</label>
          <input id="lead-company" autoComplete="organization" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-name">담당자</label>
          <input id="lead-name" autoComplete="name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-email">업무 이메일</label>
          <input id="lead-email" type="email" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-hubs">운영 중인 허브 수</label>
          <input
            id="lead-hubs"
            type="number"
            min={1}
            max={500}
            value={form.hubCount}
            onChange={(e) => update('hubCount', Number(e.target.value))}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lead-message">지금 가장 아픈 지점 (선택)</label>
        <textarea
          id="lead-message"
          maxLength={1000}
          placeholder="예: 야간 간선 저적재 출발이 잦습니다. 분류기 벤더 화면과 WCS 를 따로 봅니다."
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
        />
      </div>
      <label className="check">
        <input type="checkbox" checked={form.agreePrivacy} onChange={(e) => update('agreePrivacy', e.target.checked)} />
        <span>문의 응대를 위해 회사명·담당자·이메일을 수집하고, 응대가 끝나면 파기하는 데 동의합니다.</span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn primary large" disabled={busy || !ready}>
        {busy ? '보내는 중…' : '8주 파일럿 문의하기'}
      </button>
    </form>
  )
}

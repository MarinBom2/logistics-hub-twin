import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { centerApi } from '../../shared/api/center/centerService'
import type { CenterProfile } from '../../shared/api/center/centerService'
import { errorMessage } from '../../shared/utils/common/errorMessage'

const EMPTY = { code: '', name: '', region: '' }

/** 내 고객사의 센터 목록과 등록 (FR-CT-001). 등록은 관리자만 */
export function CentersCard({ canEdit }: { canEdit: boolean }) {
  const [centers, setCenters] = useState<CenterProfile[] | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    centerApi
      .list()
      .then(setCenters)
      .catch((caught) => setError(errorMessage(caught, '센터를 불러오지 못했습니다.')))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await centerApi.register(form)
      setCenters((prev) => [...(prev ?? []), created].sort((a, b) => a.code.localeCompare(b.code)))
      setForm(EMPTY)
    } catch (caught) {
      setError(errorMessage(caught, '센터를 등록하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2>
        센터 <span>{centers ? `${centers.length}곳` : ''}</span>
      </h2>
      {centers && centers.length === 0 && <p className="ws-muted">아직 등록한 센터가 없습니다.</p>}
      {centers && centers.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>코드</th>
              <th>이름</th>
              <th>지역</th>
              <th>수집 상태</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((center) => (
              <tr key={center.centerId}>
                <td className="mono">{center.code}</td>
                <td>{center.name}</td>
                <td>{center.region}</td>
                <td>
                  <span className="chip paused">연결 전</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {canEdit && (
        <form className="ws-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="center-code">센터 코드</label>
            <input id="center-code" placeholder="HUB-Y3" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="center-name">이름</label>
            <input id="center-name" placeholder="용인 3센터" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="center-region">지역</label>
            <input id="center-region" placeholder="경기 남부" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          </div>
          <button type="submit" className="btn primary" disabled={busy || !form.code || !form.name || !form.region}>
            센터 등록
          </button>
        </form>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  )
}

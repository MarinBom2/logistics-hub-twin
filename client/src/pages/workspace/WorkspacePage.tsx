import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CENTER_CONFIGS } from '../../features/twin/sim/centers'
import { ROUTES, demoPath, loginPath } from '../../routes'
import { organizationApi } from '../../shared/api/organization/organizationService'
import type { OrganizationProfile } from '../../shared/api/organization/organizationService'
import { useAuth } from '../../shared/auth/useAuth'
import { errorMessage } from '../../shared/utils/common/errorMessage'
import { CentersCard } from './CentersCard'
import { MembersCard } from './MembersCard'
import './workspace.css'

const DAY_MS = 86_400_000

interface Loaded {
  organization: OrganizationProfile
  /** 파일럿 남은 날. 불러온 시점 기준 */
  pilotDaysLeft: number | null
}

/** SCR-03 워크스페이스: 파일럿 상태, 센터 등록, 팀원 계정 (FR-OR-001·002, FR-CT-001) */
export default function WorkspacePage() {
  const { status, member } = useAuth()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    organizationApi
      .get()
      .then((organization) =>
        setLoaded({
          organization,
          pilotDaysLeft: organization.pilotEndsAt
            ? Math.max(0, Math.ceil((new Date(organization.pilotEndsAt).getTime() - Date.now()) / DAY_MS))
            : null,
        }),
      )
      .catch((caught) => setError(errorMessage(caught, '워크스페이스를 불러오지 못했습니다.')))
  }, [status])

  if (status === 'anonymous') return <Navigate to={loginPath(ROUTES.SCR03_WORKSPACE)} replace />
  if (status === 'checking' || !member) return <div className="page-loading" aria-busy="true" />

  const isAdmin = member.roleType.code === 'ADMIN'

  return (
    <div className="wrap workspace">
      {error && <p className="form-error">{error}</p>}
      <header className="ws-head">
        <div>
          <p className="eyebrow-text">워크스페이스</p>
          <h1>{loaded?.organization.name ?? '…'}</h1>
          <p className="ws-sub">
            {member.email} · {member.roleType.description}
          </p>
        </div>
        {loaded && (
          <div className="ws-plan card">
            <span className="badge live">{loaded.organization.planType.description}</span>
            {loaded.pilotDaysLeft !== null && loaded.organization.planType.code === 'PILOT' && (
              <>
                <strong>D-{loaded.pilotDaysLeft}</strong>
                <span>파일럿 종료까지 · 8주 차에 개선 리포트로 전환을 결정합니다</span>
              </>
            )}
          </div>
        )}
      </header>

      <section className="card ws-next">
        <h2>다음 단계</h2>
        <ol>
          <li>관제할 센터를 등록합니다. 센터 코드는 수집기가 보내는 메시지의 키가 됩니다.</li>
          <li>현장 운영자에게 운영자 계정을, 센터장에게 조회 계정을 발급합니다.</li>
          <li>수집기 설치 일정을 잡습니다. 설치 전까지는 데모 관제로 화면 구성을 미리 확인할 수 있습니다.</li>
        </ol>
        <Link to={demoPath(CENTER_CONFIGS[0].id)} className="btn">
          데모 관제 열기
        </Link>
      </section>

      <div className="ws-grid">
        <CentersCard canEdit={isAdmin} />
        {isAdmin ? (
          <MembersCard />
        ) : (
          <section className="card">
            <h2>팀원</h2>
            <p className="ws-muted">팀원 계정은 관리자만 볼 수 있습니다.</p>
          </section>
        )}
      </div>
    </div>
  )
}

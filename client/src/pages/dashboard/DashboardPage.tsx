import { Link, useParams } from 'react-router-dom'
import { TwinStage } from '../../features/twin/TwinStage'
import { useHubNetwork } from '../../features/twin/sim/useHubNetwork'
import { SECTIONS, sectionPath } from '../../routes'
import { CenterHeader } from './CenterHeader'
import { CenterNetwork } from './CenterNetwork'
import { DockPanel } from './DockPanel'
import { EventLog } from './EventLog'
import { KpiStrip } from './KpiStrip'
import './dashboard.css'

/**
 * SCR-01 데모 관제 화면: 센터 네트워크(센터 고르기) → 선택 센터 KPI → 3D 현장 옆에 도크·이벤트.
 * 브라우저 안 시뮬레이션 데이터다. 고객사 실데이터(M3·M4)는 워크스페이스에서 같은 패널로 보여 준다.
 */
export default function DashboardPage() {
  const { centerId = '' } = useParams()
  const { center, summaries, detail, control } = useHubNetwork(centerId)

  return (
    <div className="wrap">
      <div className="demo-banner">
        <span className="badge live">LIVE DEMO</span>
        <p>
          가상의 센터 3곳이 브라우저에서 돌아가는 시뮬레이션입니다. 유입량을 올리고 집게차를 1대로 줄여 적체가 생기는 순간을 확인해 보세요.
        </p>
        <Link to={sectionPath(SECTIONS.contact)} className="btn primary small">
          우리 허브로 파일럿 문의
        </Link>
      </div>
      <CenterNetwork summaries={summaries} selectedId={detail.id} />
      <CenterHeader
        detail={detail}
        onSpeedChange={control.setSpeed}
        onForkCountChange={control.setForkCount}
        onToggleRunning={control.toggleRunning}
      />
      <KpiStrip detail={detail} />
      <main className="layout">
        <TwinStage center={center} />
        <aside className="rail">
          <DockPanel docks={detail.docks} />
          <EventLog log={detail.log} />
        </aside>
      </main>
    </div>
  )
}

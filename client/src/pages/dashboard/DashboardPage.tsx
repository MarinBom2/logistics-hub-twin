import { useParams } from 'react-router-dom'
import { useHubNetwork } from '../../features/twin/sim/useHubNetwork'
import { CenterHeader } from './CenterHeader'
import { CenterNetwork } from './CenterNetwork'
import { DockPanel } from './DockPanel'
import { EventLog } from './EventLog'
import { KpiStrip } from './KpiStrip'
import { TwinStage } from './TwinStage'
import './dashboard.css'

/**
 * SCR-01 관제 화면: 센터 네트워크(센터 고르기) → 선택 센터 KPI → 3D 현장 옆에 도크·이벤트.
 * 지금은 브라우저 안 시뮬레이션 데이터다. 서버 실시간 채널(M4)이 붙으면 useHubNetwork 만 바뀐다.
 */
export default function DashboardPage() {
  const { centerId = '' } = useParams()
  const { center, summaries, detail, control } = useHubNetwork(centerId)

  return (
    <div className="wrap">
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

import type { DockSnapshot } from '../../features/twin/sim/types'
import { LOW_LOAD_RATE } from '../../features/twin/sim/layout'
import { formatCountdown } from '../../shared/utils/common/time'

function barColor(dock: DockSnapshot) {
  if (dock.late) return 'var(--crit)'
  return dock.loadPct >= LOW_LOAD_RATE * 100 ? 'var(--ok)' : 'var(--info)'
}

/** 도크별 간선 트럭: 적재율 바, 출발 카운트다운, 마감 임박 표시 */
export function DockPanel({ docks }: { docks: DockSnapshot[] }) {
  return (
    <section className="card" aria-label="도크 상차 현황">
      <h2>
        도크 · 간선 트럭 <span>출발까지</span>
      </h2>
      <div className="docks">
        {docks.map((dock) => (
          <div key={dock.code} className={dock.late ? 'dock late' : 'dock'}>
            <span className="d">{dock.code}</span>
            <div className="mid">
              <div className="row">
                <span>{dock.lane}</span>
                <span>{dock.loadPct}%</span>
              </div>
              <div className="bar">
                <div style={{ width: `${dock.loadPct}%`, background: barColor(dock) }} />
              </div>
            </div>
            <div className="eta">
              <b>{dock.etaSec === null ? '--:--' : formatCountdown(dock.etaSec)}</b>
              <span>{dock.status}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

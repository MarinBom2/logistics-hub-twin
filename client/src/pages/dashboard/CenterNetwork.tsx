import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CenterSummary } from '../../features/twin/sim/types'
import { dashboardPath } from '../../routes'
import { LEVEL_TEXT, formatNumber, levelClass } from './levels'

const ALL = '전체'

/** 센터 네트워크: 지역 필터와 센터 카드. 카드를 누르면 그 센터를 관제한다 */
export function CenterNetwork({ summaries, selectedId }: { summaries: CenterSummary[]; selectedId: string }) {
  const navigate = useNavigate()
  const [region, setRegion] = useState(ALL)
  const regions = [ALL, ...new Set(summaries.map((center) => center.region))]

  return (
    <section className="network" aria-label="센터 네트워크">
      <div className="net-head">
        <h2>
          센터 네트워크 · <b>{summaries.length}</b>개 센터 · 시뮬레이션 데이터
        </h2>
        <div className="regions" role="group" aria-label="지역 필터">
          {regions.map((name) => (
            <button key={name} type="button" aria-pressed={name === region} onClick={() => setRegion(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="centers">
        {summaries.map((center) => (
          <button
            key={center.id}
            type="button"
            className="center"
            aria-pressed={center.id === selectedId}
            hidden={region !== ALL && center.region !== region}
            onClick={() => navigate(dashboardPath(center.id))}
          >
            <div className="h">
              <div className="nm">
                <b>{center.name}</b>
                <span>
                  {center.code} · {center.region}
                </span>
              </div>
              <span className={levelClass(center.level)}>{LEVEL_TEXT[center.level]}</span>
            </div>
            <div className="st">
              <div>
                <span>시간당</span>
                <b>{formatNumber(center.pph)}</b>
              </div>
              <div>
                <span>판독률</span>
                <b>{center.readRate.toFixed(1)}%</b>
              </div>
              <div>
                <span>적체</span>
                <b className={center.jam > 0 ? 'bad' : undefined}>{center.jam}</b>
              </div>
              <div>
                <span>출발</span>
                <b>{center.departed}</b>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

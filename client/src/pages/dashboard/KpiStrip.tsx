import type { CenterDetail } from '../../features/twin/sim/types'
import { LANE_COUNT } from '../../features/twin/sim/layout'
import { formatNumber } from './levels'

/** 선택한 센터의 핵심 지표 (md/logistics-hub-twin.md §2.5) */
export function KpiStrip({ detail }: { detail: CenterDetail }) {
  return (
    <section className="kpis" aria-label="선택한 센터의 핵심 지표">
      <div className="kpi">
        <span className="k">시간당 분류량</span>
        <span className="v">{formatNumber(detail.pph)}</span>
        <span className="s">개/시간 · 최근 60초</span>
      </div>
      <div className="kpi">
        <span className="k">금일 누적 처리</span>
        <span className="v">{formatNumber(detail.processed)}</span>
        <span className="s">06:00 근무 시작부터</span>
      </div>
      <div className="kpi">
        <span className="k">송장 판독률</span>
        <span className="v">{detail.readRate.toFixed(2)}%</span>
        <span className="s">
          리젝트 {formatNumber(detail.rejects)}건 · 재순환 {formatNumber(detail.recirc)}건
        </span>
      </div>
      <div className={detail.jam > 0 ? 'kpi alert' : 'kpi'}>
        <span className="k">적체 분류구</span>
        <span className="v">
          {detail.jam}
          <small> / {LANE_COUNT}</small>
        </span>
        <span className="s">집게차 대기 {detail.waitLanes}곳</span>
      </div>
      <div className="kpi">
        <span className="k">간선 출발 완료</span>
        <span className="v">
          {detail.departed}
          <small> 대</small>
        </span>
        <span className="s">11톤 윙바디 기준</span>
      </div>
    </section>
  )
}

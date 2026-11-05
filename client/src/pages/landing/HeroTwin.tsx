import { TwinStage } from '../../features/twin/TwinStage'
import { useHubNetwork } from '../../features/twin/sim/useHubNetwork'
import { formatNumber } from '../dashboard/levels'

/** 첫 화면의 라이브 3D. 데모 관제와 같은 시뮬레이션을 돌리고 핵심 숫자 넷만 겹쳐 보인다 */
export function HeroTwin() {
  const { center, detail } = useHubNetwork('y3')
  const late = detail.docks.filter((dock) => dock.late).length

  return (
    <div className="hero-twin">
      <TwinStage center={center} className="hero-stage" />
      <dl className="hero-kpis">
        <div>
          <dt>시간당 분류량</dt>
          <dd>{formatNumber(detail.pph)}</dd>
        </div>
        <div>
          <dt>송장 판독률</dt>
          <dd>{detail.readRate.toFixed(2)}%</dd>
        </div>
        <div className={detail.jam > 0 ? 'alert' : undefined}>
          <dt>적체 분류구</dt>
          <dd>{detail.jam}</dd>
        </div>
        <div className={late > 0 ? 'alert' : undefined}>
          <dt>출발 마감 임박</dt>
          <dd>{late}</dd>
        </div>
      </dl>
      <p className="hero-caption">{detail.name} · 시뮬레이션 데이터로 실시간 동작 중</p>
    </div>
  )
}

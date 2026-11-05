import { SPEED_LABEL } from '../../features/twin/sim/layout'
import type { CenterDetail } from '../../features/twin/sim/types'
import { formatClock } from '../../shared/utils/common/time'

interface CenterHeaderProps {
  detail: CenterDetail
  onSpeedChange: (speed: number) => void
  onForkCountChange: (count: number) => void
  onToggleRunning: () => void
}

/** 선택한 센터 이름·상태와 제어(레일 유입량, 집게차 대수, 일시정지) */
export function CenterHeader({ detail, onSpeedChange, onForkCountChange, onToggleRunning }: CenterHeaderProps) {
  return (
    <header className="top">
      <div className="ident">
        <div className="eyebrow">
          <span>
            {detail.code} · {detail.region} · 간선 상하차
          </span>
          <span className={detail.running ? 'pill' : 'pill paused'}>{detail.running ? '가동중' : '일시정지'}</span>
        </div>
        <h1>{detail.name}</h1>
      </div>
      <div className="controls">
        <div className="clock">
          <b>{formatClock(detail.clockSec)}</b>
          <span>시뮬레이션 시각</span>
        </div>
        <div className="ctl">
          <label htmlFor="speed">레일 유입량</label>
          <input
            id="speed"
            type="range"
            min={1}
            max={5}
            step={1}
            value={detail.speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />
          <output htmlFor="speed">{SPEED_LABEL[detail.speed]}</output>
        </div>
        <div className="ctl">
          <span className="lbl" id="forkLabel">
            집게차
          </span>
          <div className="seg" role="group" aria-labelledby="forkLabel">
            {[1, 2].map((count) => (
              <button key={count} type="button" aria-pressed={detail.forkCount === count} onClick={() => onForkCountChange(count)}>
                {count}대
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn" onClick={onToggleRunning}>
          {detail.running ? '일시정지' : '재개'}
        </button>
      </div>
    </header>
  )
}

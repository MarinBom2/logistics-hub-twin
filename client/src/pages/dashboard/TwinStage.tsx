import { Component, Suspense, lazy, useState } from 'react'
import type { ReactNode } from 'react'
import type { Center } from '../../features/twin/sim/Center'
import { CAMERA_PRESETS } from '../../features/twin/scene/cameras'
import type { CameraPreset } from '../../features/twin/scene/cameras'
import { loadTwinScene } from '../../routeChunks'

const TwinScene = lazy(loadTwinScene)

const FALLBACK_TEXT = '이 브라우저에서는 3D 화면을 표시할 수 없어요. 센터 현황과 도크, 이벤트는 계속 갱신됩니다.'

function Fallback() {
  return <div className="fallback">{FALLBACK_TEXT}</div>
}

/** WebGL 컨텍스트를 만들다 실패해도 나머지 화면은 살린다 */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children
  }
}

/** 3D 현장과 그 위 겹침 UI(카메라 시점, 범례, 조작 안내) */
export function TwinStage({ center }: { center: Center }) {
  const [preset, setPreset] = useState<CameraPreset>('all')

  return (
    <div className="stage">
      <SceneBoundary>
        <Suspense fallback={<div className="fallback">3D 현장을 불러오는 중…</div>}>
          <TwinScene center={center} preset={preset} fallback={<Fallback />} />
        </Suspense>
      </SceneBoundary>
      <div className="cams" role="group" aria-label="카메라 시점">
        {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => (
          <button key={key} type="button" aria-pressed={preset === key} onClick={() => setPreset(key)}>
            {CAMERA_PRESETS[key].label}
          </button>
        ))}
      </div>
      <div className="legend">
        <span style={{ '--c': 'var(--info)' } as React.CSSProperties}>적재중</span>
        <span style={{ '--c': 'var(--safety)' } as React.CSSProperties}>집게차 대기</span>
        <span style={{ '--c': 'var(--crit)' } as React.CSSProperties}>적체</span>
      </div>
      <div className="hint">드래그 회전 · 휠 확대</div>
    </div>
  )
}

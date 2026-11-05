import { useCallback, useEffect, useState } from 'react'
import { CENTER_CONFIGS } from './centers'
import { HubNetwork } from './HubNetwork'
import type { CenterDetail, CenterSummary } from './types'

/** 패널 갱신 주기. 시뮬레이션은 매 프레임 돌고, 숫자 패널은 초당 4번만 다시 그린다 */
const PANEL_INTERVAL_MS = 250
/** 탭을 오래 비웠다 돌아와도 한 번에 0.1초 이상 진행하지 않는다 */
const MAX_STEP_SEC = 0.1

interface HubView {
  summaries: CenterSummary[]
  detail: CenterDetail
}

/**
 * 시뮬레이션 루프와 패널 스냅샷. 3D 화면이 없어도(WebGL 미지원) 숫자는 계속 갱신된다.
 * 서버 실시간 채널(M4)이 붙으면 이 훅만 STOMP 구독으로 바꾸고 패널은 그대로 쓴다.
 */
export function useHubNetwork(centerId: string) {
  const [network] = useState(() => new HubNetwork(CENTER_CONFIGS))
  const [view, setView] = useState<HubView>(() => ({
    summaries: network.summaries(),
    detail: network.detail(centerId),
  }))

  const refresh = useCallback(() => {
    setView({ summaries: network.summaries(), detail: network.detail(centerId) })
  }, [network, centerId])

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let panelAcc = PANEL_INTERVAL_MS

    const step = (now: number) => {
      const dt = Math.min(MAX_STEP_SEC, (now - last) / 1000)
      last = now
      network.update(dt)
      panelAcc += dt * 1000
      if (panelAcc >= PANEL_INTERVAL_MS) {
        panelAcc = 0
        refresh()
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [network, refresh])

  const control = {
    setSpeed: (speed: number) => {
      network.setSpeed(centerId, speed)
      refresh()
    },
    setForkCount: (count: number) => {
      network.setForkCount(centerId, count)
      refresh()
    },
    toggleRunning: () => {
      network.toggleRunning(centerId)
      refresh()
    },
  }

  // 센터를 바꾼 직후 다음 갱신 전까지 이전 센터 값이 보이지 않게 바로 만든다
  const detail = view.detail.id === network.get(centerId).cfg.id ? view.detail : network.detail(centerId)

  return { center: network.get(centerId), summaries: view.summaries, detail, control }
}

import { Center } from './Center'
import type { CenterConfig, CenterDetail, CenterSummary } from './types'

/**
 * 여러 센터를 한꺼번에 돌린다. 화면이 보지 않는 센터도 계속 돈다 (네트워크 카드가 실시간이어야 하므로).
 * 패널은 snapshot() 의 값만 그리고, 3D 화면만 get() 으로 살아 있는 상태를 직접 읽는다.
 */
export class HubNetwork {
  readonly centers: Center[]

  constructor(configs: CenterConfig[]) {
    this.centers = configs.map((cfg) => new Center(cfg))
  }

  /** 없는 센터면 첫 센터. 호출부가 빈 값을 다루지 않게 한다 */
  get(id: string | undefined): Center {
    return this.centers.find((center) => center.cfg.id === id) ?? this.centers[0]
  }

  update(dt: number) {
    for (const center of this.centers) center.update(dt)
  }

  setSpeed(id: string, speed: number) {
    this.get(id).speed = speed
  }

  setForkCount(id: string, forkCount: number) {
    this.get(id).forkCount = forkCount
  }

  toggleRunning(id: string) {
    const center = this.get(id)
    center.running = !center.running
  }

  summaries(): CenterSummary[] {
    return this.centers.map(summarize)
  }

  detail(id: string): CenterDetail {
    const center = this.get(id)
    const kpi = center.kpi()
    return {
      ...summarize(center),
      running: center.running,
      speed: center.speed,
      forkCount: center.forkCount,
      clockSec: center.t,
      processed: center.processed,
      rejects: center.rejects,
      recirc: center.recirc,
      waitLanes: kpi.wait,
      docks: center.trucks.map((truck, i) => {
        const status = center.truckStatus(truck)
        return {
          code: `D${i + 1}`,
          lane: `${center.laneDefs[i].code} · ${center.laneDefs[i].name}`,
          loadPct: Math.round(truck.load * 100),
          etaSec: truck.phase === 'docked' ? truck.eta : null,
          status: status.text,
          late: status.late,
        }
      }),
      log: [...center.log],
    }
  }
}

function summarize(center: Center): CenterSummary {
  const kpi = center.kpi()
  return {
    id: center.cfg.id,
    name: center.cfg.name,
    code: center.cfg.code,
    region: center.cfg.region,
    level: kpi.level,
    pph: kpi.pph,
    readRate: kpi.readRate,
    jam: kpi.jam,
    departed: center.departed,
  }
}

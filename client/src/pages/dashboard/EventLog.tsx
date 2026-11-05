import type { LogEntry } from '../../features/twin/sim/types'

/** 이벤트 · 알람 피드. 최신이 위, 12건까지 */
export function EventLog({ log }: { log: LogEntry[] }) {
  return (
    <section className="card" aria-label="이벤트와 알람">
      <h2>이벤트 · 알람</h2>
      <div className="log">
        {log.map((entry, i) => (
          // 목록이 통째로 밀리므로 순번 키로 충분하다
          <div key={i} className={entry.lv}>
            <time>{entry.t}</time>
            <i />
            <span>{entry.m}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

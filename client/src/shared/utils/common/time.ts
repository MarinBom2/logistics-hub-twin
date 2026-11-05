const pad = (n: number) => String(n).padStart(2, '0')

/** 자정부터 초 → HH:MM:SS */
export function formatClock(sec: number) {
  return `${pad(Math.floor(sec / 3600) % 24)}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}`
}

/** 남은 초 → MM:SS (음수는 0) */
export function formatCountdown(sec: number) {
  const s = Math.max(0, sec)
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

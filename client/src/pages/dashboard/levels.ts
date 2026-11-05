import type { HealthLevel } from '../../features/twin/sim/types'

export const LEVEL_TEXT: Record<HealthLevel, string> = { ok: '정상', warn: '주의', crit: '적체', paused: '정지' }

export const levelClass = (level: HealthLevel) => (level === 'ok' ? 'chip' : `chip ${level}`)

export const formatNumber = (value: number) => value.toLocaleString('ko-KR')

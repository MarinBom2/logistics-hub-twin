import { useEffect, useState } from 'react'
import { salesApi } from '../../shared/api/sales/salesService'
import type { RoiEstimate, RoiInput } from '../../shared/api/sales/salesService'
import { errorMessage } from '../../shared/utils/common/errorMessage'

/** 기본값은 가정이다 (md/business-plan.md §4). 고객사 수치를 넣으면 바뀐다 */
const DEFAULTS: RoiInput = {
  hubCount: 1,
  departuresPerHubPerDay: 60,
  operatingDaysPerMonth: 26,
  lowLoadDeparturePercent: 20,
  lowLoadAverageLoadPercent: 70,
  targetLoadPercent: 90,
  tripCostWon: 400_000,
  jamMinutesPerHubPerDay: 30,
  crewPerHub: 20,
  hourlyWageWon: 15_000,
  improvementPercent: 30,
}

interface FieldDef {
  key: keyof RoiInput
  label: string
  unit: string
  min: number
  max: number
  step?: number
}

const MAIN: FieldDef[] = [
  { key: 'hubCount', label: '허브 수', unit: '곳', min: 1, max: 500 },
  { key: 'departuresPerHubPerDay', label: '허브당 하루 간선 출발', unit: '대', min: 0, max: 1000 },
  { key: 'lowLoadDeparturePercent', label: '저적재로 떠나는 비율', unit: '%', min: 0, max: 100 },
  { key: 'tripCostWon', label: '간선 1회 운행비', unit: '원', min: 0, max: 100_000_000, step: 10_000 },
  { key: 'jamMinutesPerHubPerDay', label: '허브당 하루 적체 시간', unit: '분', min: 0, max: 1440 },
]

const ADVANCED: FieldDef[] = [
  { key: 'lowLoadAverageLoadPercent', label: '저적재 출발 평균 적재율', unit: '%', min: 0, max: 100 },
  { key: 'targetLoadPercent', label: '목표 적재율', unit: '%', min: 0, max: 100 },
  { key: 'crewPerHub', label: '적체 때 기다리는 인원', unit: '명', min: 0, max: 1000 },
  { key: 'hourlyWageWon', label: '시간당 인건비', unit: '원', min: 0, max: 1_000_000, step: 1000 },
  { key: 'operatingDaysPerMonth', label: '월 가동일', unit: '일', min: 1, max: 31 },
  { key: 'improvementPercent', label: '줄일 수 있는 손실 비율 (가정)', unit: '%', min: 0, max: 100 },
]

const won = (value: number) => `₩${Math.round(value).toLocaleString('ko-KR')}`
const ALL_FIELDS = [...MAIN, ...ADVANCED]
const isValid = (input: RoiInput) => ALL_FIELDS.every(({ key, min, max }) => Number.isFinite(input[key]) && input[key] >= min && input[key] <= max)

function NumberField({ field, value, onChange }: { field: FieldDef; value: number; onChange: (value: number) => void }) {
  const id = `roi-${field.key}`
  return (
    <div className="field roi-field">
      <label htmlFor={id}>{field.label}</label>
      <div className="with-unit">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={Number.isNaN(value) ? '' : value}
          onChange={(event) => onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))}
        />
        <span>{field.unit}</span>
      </div>
    </div>
  )
}

/** SCR-00 투자 대비 효과 계산기 (FR-SL-001). 계산은 서버 RoiEstimator 한 곳에서 한다 */
export function RoiCalculator() {
  const [input, setInput] = useState<RoiInput>(DEFAULTS)
  const [result, setResult] = useState<RoiEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const valid = isValid(input)

  useEffect(() => {
    if (!valid) return
    const controller = new AbortController()
    // 입력이 멈춘 뒤 한 번만 부른다
    const timer = setTimeout(() => {
      salesApi
        .estimateRoi(input, controller.signal)
        .then((estimate) => {
          setResult(estimate)
          setError(null)
        })
        .catch((caught) => {
          if (!controller.signal.aborted) setError(errorMessage(caught, '계산하지 못했습니다.'))
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [input, valid])

  const set = (key: keyof RoiInput) => (value: number) => setInput((prev) => ({ ...prev, [key]: value }))
  const lossTotal = result ? Math.max(1, result.monthlyLossWon) : 1

  return (
    <div className="roi">
      <form className="roi-inputs card" onSubmit={(event) => event.preventDefault()}>
        <h3>우리 허브 숫자</h3>
        {MAIN.map((field) => (
          <NumberField key={field.key} field={field} value={input[field.key]} onChange={set(field.key)} />
        ))}
        <details>
          <summary>세부 가정 바꾸기</summary>
          {ADVANCED.map((field) => (
            <NumberField key={field.key} field={field} value={input[field.key]} onChange={set(field.key)} />
          ))}
        </details>
        {!valid && <p className="form-error">입력 범위를 확인해 주세요.</p>}
        <button type="button" className="btn ghost" onClick={() => setInput(DEFAULTS)}>
          기본값으로
        </button>
      </form>

      <div className="roi-result card" aria-live="polite">
        {error && <p className="form-error">{error}</p>}
        {result ? (
          <>
            <span className="roi-label">예상 월 절감액</span>
            <strong className="roi-big">{won(result.monthlySavingWon)}</strong>
            <span className="roi-sub">연 {won(result.annualSavingWon)}</span>

            <div className="roi-split">
              <div>
                <span>지금 새는 비용 (월)</span>
                <b>{won(result.monthlyLossWon)}</b>
              </div>
              <div className="roi-bars" aria-hidden="true">
                <i style={{ width: `${(result.monthlyLowLoadLossWon / lossTotal) * 100}%`, background: 'var(--info)' }} />
                <i style={{ width: `${(result.monthlyJamLossWon / lossTotal) * 100}%`, background: 'var(--safety)' }} />
              </div>
              <ul className="roi-legend">
                <li>
                  <i style={{ background: 'var(--info)' }} />
                  저적재 출발 {won(result.monthlyLowLoadLossWon)}
                </li>
                <li>
                  <i style={{ background: 'var(--safety)' }} />
                  적체 대기 {won(result.monthlyJamLossWon)}
                </li>
              </ul>
            </div>

            <dl className="roi-compare">
              <div>
                <dt>허브 요금제 구독료 (월)</dt>
                <dd>{won(result.monthlyFeeWon)}</dd>
              </div>
              <div>
                <dt>구독료를 빼고 남는 금액 (월)</dt>
                <dd className={result.netMonthlyBenefitWon < 0 ? 'neg' : 'pos'}>{won(result.netMonthlyBenefitWon)}</dd>
              </div>
              <div>
                <dt>구독료 대비 절감</dt>
                <dd>{result.roiMultiple === null ? '-' : `${result.roiMultiple.toFixed(1)}배`}</dd>
              </div>
            </dl>
            <p className="roi-note">
              입력값과 가정에 기댄 추정입니다. 파일럿 8주 동안 실제 저적재 출발과 적체 시간을 측정해 이 숫자를 실측으로 바꿉니다.
            </p>
          </>
        ) : (
          !error && <p className="roi-note">계산 중…</p>
        )}
      </div>
    </div>
  )
}

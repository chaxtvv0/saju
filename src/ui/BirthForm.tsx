import { useState, type FormEvent } from 'react'
import type { BirthInput, Gender } from '@orrery/core/types'
import { BIRTH_PLACES, DEFAULT_PLACE, findPlace } from '../cities.ts'

const STORAGE_KEY = 'saju-compat:last-input'

/** 입력값 + 출생지 표시명 */
export interface BirthEntry extends BirthInput {
  place: string
}

/** 마지막으로 본 입력을 복원 (없으면 null: 아직 입력 전) */
export function loadInput(): BirthEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* 저장소 차단 시 입력 전 상태로 */ }
  return null
}

function saveInput(input: BirthEntry) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
  } catch { /* 무시 */ }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function BirthForm({ value, onSubmit }: { value: BirthEntry | null; onSubmit: (v: BirthEntry) => void }) {
  const [date, setDate] = useState(value ? `${value.year}-${pad(value.month)}-${pad(value.day)}` : '')
  const [time, setTime] = useState(value ? `${pad(value.hour)}:${pad(value.minute)}` : '12:00')
  const [unknownTime, setUnknownTime] = useState(!!value?.unknownTime)
  const [gender, setGender] = useState<Gender>(value?.gender ?? 'M')
  const [place, setPlace] = useState(value?.place ?? DEFAULT_PLACE.label)
  const placeValid = !!findPlace(place)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    const city = findPlace(place)
    if (!y || !m || !d || !city) return
    const next: BirthEntry = {
      year: y, month: m, day: d,
      hour: unknownTime ? 12 : hh || 0,
      minute: unknownTime ? 0 : mm || 0,
      gender, unknownTime,
      latitude: city.latitude, longitude: city.longitude, timezone: city.timezone,
      place: city.label,
    }
    saveInput(next)
    onSubmit(next)
  }

  return (
    <form className="card form" onSubmit={submit}>
      <label className="field">
        <span>생년월일 (양력)</span>
        <input type="date" value={date} min="1900-01-01" max="2100-12-31" required
          onChange={e => setDate(e.target.value)} />
      </label>
      <label className="field">
        <span>태어난 시각</span>
        <input type="time" value={time} disabled={unknownTime} onChange={e => setTime(e.target.value)} />
      </label>
      <label className="check">
        <input type="checkbox" checked={unknownTime} onChange={e => setUnknownTime(e.target.checked)} />
        시간 모름
      </label>
      <fieldset className="segmented">
        <legend>성별</legend>
        {(['M', 'F'] as const).map(g => (
          <label key={g} className={gender === g ? 'on' : ''}>
            <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} />
            {g === 'M' ? '남' : '여'}
          </label>
        ))}
      </fieldset>
      <label className="field place">
        <span>태어난 지역</span>
        <input list="birth-places" value={place} required placeholder="도시 이름 (예: 부산, 도쿄)"
          aria-invalid={!placeValid}
          onChange={e => setPlace(e.target.value)}
          onFocus={e => e.target.select()} />
        <datalist id="birth-places">
          {BIRTH_PLACES.map(p => <option key={p.label} value={p.label} />)}
        </datalist>
        {!placeValid && place && <small className="hint">목록에 있는 도시를 골라 주세요</small>}
      </label>
      <button type="submit" className="primary" disabled={!placeValid}>궁합 보기</button>
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import type { BirthInput, Gender } from '@orrery/core/types'

const STORAGE_KEY = 'saju-analysis:last-input'
const SAMPLE: BirthInput = { year: 1993, month: 3, day: 12, hour: 9, minute: 45, gender: 'M' }

/** 마지막으로 본 입력을 복원 (저장소를 못 쓰면 예제) */
export function loadInput(): BirthInput {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...SAMPLE, ...JSON.parse(raw) }
  } catch { /* 저장소 차단 시 예제로 */ }
  return SAMPLE
}

function saveInput(input: BirthInput) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
  } catch { /* 무시 */ }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function BirthForm({ value, onSubmit }: { value: BirthInput; onSubmit: (v: BirthInput) => void }) {
  const [date, setDate] = useState(`${value.year}-${pad(value.month)}-${pad(value.day)}`)
  const [time, setTime] = useState(`${pad(value.hour)}:${pad(value.minute)}`)
  const [unknownTime, setUnknownTime] = useState(!!value.unknownTime)
  const [gender, setGender] = useState<Gender>(value.gender)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    if (!y || !m || !d) return
    const next: BirthInput = {
      year: y, month: m, day: d,
      hour: unknownTime ? 12 : hh || 0,
      minute: unknownTime ? 0 : mm || 0,
      gender, unknownTime,
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
      <button type="submit" className="primary">분석하기</button>
    </form>
  )
}

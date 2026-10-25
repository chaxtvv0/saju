import type { SajuResult } from '@orrery/core/types'
import { currentDaewoon, summarizeLuck, yearLuck, type LuckSummary, type SajuAnalysis } from '../analysis.ts'

const RATING_CLASS: Record<LuckSummary['rating'], string> = { 좋음: 'good', 보통: 'neutral', 주의: 'caution' }

function LuckNotes({ title, luck }: { title: string; luck: LuckSummary }) {
  if (luck.notes.length === 0) return null
  return (
    <ul className="luck-notes">
      {luck.notes.map(n => <li key={n}><strong>{title} {luck.ganzi}</strong> {n}</li>)}
    </ul>
  )
}

function LuckCard({ title, luck, current }: { title: string; luck: LuckSummary; current?: boolean }) {
  return (
    <li className={`luck ${current ? 'current' : ''}`} title={luck.notes.join('\n') || undefined}>
      <span className="luck-title">{title}</span>
      <span className="luck-ganzi">{luck.ganzi}</span>
      <span className="luck-sipsin">{luck.stemSipsin} / {luck.branchSipsin}</span>
      <span className={`rating ${RATING_CLASS[luck.rating]}`}>{luck.rating}</span>
      {luck.interactions.length > 0 && <span className="luck-rel">{luck.interactions.join(', ')}</span>}
    </li>
  )
}

export function LuckTimeline({ result, analysis }: { result: SajuResult; analysis: SajuAnalysis }) {
  const now = new Date()
  const current = currentDaewoon(result, now)
  const thisYear = now.getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => thisYear + i)

  return (
    <section className="card">
      <h2>운의 흐름</h2>
      <h3>대운 (10년 단위)</h3>
      <ol className="luck-row">
        {result.daewoon.map(d => (
          <LuckCard key={d.index} title={`${d.age}세~`} luck={summarizeLuck(d.ganzi, result, analysis)}
            current={d === current} />
        ))}
      </ol>
      {current && <LuckNotes title="현재 대운" luck={summarizeLuck(current.ganzi, result, analysis)} />}
      <h3>세운 (해마다)</h3>
      <ol className="luck-row">
        {years.map(y => (
          <LuckCard key={y} title={`${y}년`} luck={yearLuck(y, result, analysis)} current={y === thisYear} />
        ))}
      </ol>
      <LuckNotes title={`${thisYear}년`} luck={yearLuck(thisYear, result, analysis)} />
      <p className="note">
        좋음/주의는 운의 천간·지지가 용신 오행인지(지지에 두 배 비중)에, 원국과의 합·삼합·충·형과 특수 구도를 더해 매긴 평가입니다.
        기신을 충하는 것은 감점하지 않고, 기신이 커져도 용신을 생해 주면(통관) 감점하지 않습니다. 카드에 마우스를 올리면 근거가 보입니다.
      </p>
    </section>
  )
}

import type { CSSProperties } from 'react'
import { roleText, type Compatibility } from '../compat.ts'
import { ME_NAME } from '../me.ts'

const tone = (score: number) => (score >= 1 ? 'good' : score <= -1 ? 'caution' : 'neutral')

export function CompatCard({ compat }: { compat: Compatibility }) {
  const { total, grade, items, roles } = compat
  return (
    <section className="card compat">
      <h2>{ME_NAME}와의 궁합</h2>
      <div className="compat-head">
        <div className="score-ring" style={{ '--p': total } as CSSProperties}
          role="img" aria-label={`궁합 점수 ${total}점`}>
          <span className="score-num">{total}</span>
          <span className="score-unit">점</span>
        </div>
        <div>
          <p className="lead"><strong>{grade}</strong></p>
          <p className="roles">
            {ME_NAME}에게 당신은 <strong>{roles.themToMe}</strong>, {roleText(roles.themToMe)}입니다.
            <br />
            당신에게 {ME_NAME}는 <strong>{roles.meToThem}</strong>, {roleText(roles.meToThem)}입니다.
          </p>
        </div>
      </div>
      <ul className="compat-items">
        {items.map(item => (
          <li key={item.title}>
            <div className="row-between">
              <h3>{item.title}</h3>
              <span className={`rating ${tone(item.score)}`}>
                {item.score > 0 ? '+' : ''}{item.score.toFixed(1).replace(/\.0$/, '')}
              </span>
            </div>
            <p className="compat-summary">{item.summary}</p>
            <p className="compat-detail">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

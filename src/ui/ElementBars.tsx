import { ELEMENT_KO, type SajuAnalysis } from '../analysis.ts'

export function ElementBars({ analysis }: { analysis: SajuAnalysis }) {
  const max = Math.max(...analysis.elements.map(e => e.score), 1)

  return (
    <section className="card">
      <h2>오행 분포</h2>
      <ul className="bars">
        {analysis.elements.map(e => (
          <li key={e.element}>
            <span className="bar-label">{ELEMENT_KO[e.element]}</span>
            <span className="bar-track">
              <span className={`bar-fill ${e.element}`} style={{ width: `${(e.score / max) * 100}%` }} />
            </span>
            <span className="bar-value">{e.count}개</span>
          </li>
        ))}
      </ul>
      <p className="note">
        막대는 위치 가중 점수(월지 3, 일지 1.5, 나머지 1, 일간 제외)로, 지지는 지장간 비율로 나누고 원국의 합을 더했습니다. 숫자는 글자 수입니다.
        {analysis.missingElements.length > 0 &&
          ` 없는 오행: ${analysis.missingElements.map(e => ELEMENT_KO[e]).join(', ')}.`}
      </p>
    </section>
  )
}

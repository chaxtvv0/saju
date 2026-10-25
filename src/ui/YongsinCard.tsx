import { ELEMENT_KO, groupOf, type SajuAnalysis } from '../analysis.ts'

export function YongsinCard({ analysis }: { analysis: SajuAnalysis }) {
  const { yongsin, dayMaster, patterns } = analysis
  const label = (e: (typeof yongsin.favorable)[number]) => `${ELEMENT_KO[e]} · ${groupOf(dayMaster.element, e)}`

  return (
    <section className="card">
      <h2>용신 (추정)</h2>
      <div className="yongsin">
        <div>
          <h3>도움 되는 기운</h3>
          <ol className="pills">
            {yongsin.favorable.map(e => <li key={e} className={`pill ${e}`}>{label(e)}</li>)}
          </ol>
        </div>
        {yongsin.conditional.length > 0 && (
          <div>
            <h3>조건부 기운</h3>
            <ul className="pills">
              {yongsin.conditional.map(e => <li key={e} className={`pill ${e}`} title="조후상 필요해 용신과 함께 오면 좋은 기운">{label(e)}</li>)}
            </ul>
          </div>
        )}
        <div>
          <h3>조심할 기운</h3>
          <ul className="pills">
            {yongsin.unfavorable.map(e => <li key={e} className="pill outline">{label(e)}</li>)}
          </ul>
        </div>
      </div>
      <p>{yongsin.reason}</p>
      {yongsin.johu && (
        <p className="callout">조후(궁통보감 {yongsin.johu.stems}): {yongsin.johu.note}</p>
      )}
      {patterns.map(p => <p key={p.name} className="callout"><strong>{p.name}</strong> {p.text}</p>)}
    </section>
  )
}

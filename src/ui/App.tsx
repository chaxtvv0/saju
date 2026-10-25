import { useMemo, useState } from 'react'
import { calculateSaju } from '@orrery/core/saju'
import { analyzeSaju, ELEMENT_KO } from '../analysis.ts'
import { analyzeCompatibility } from '../compat.ts'
import { ME, ME_ANALYSIS, ME_NAME } from '../me.ts'
import { BirthForm, loadInput, type BirthEntry } from './BirthForm.tsx'
import { CompatCard } from './CompatCard.tsx'
import { PillarChart } from './PillarChart.tsx'
import { ElementBars } from './ElementBars.tsx'
import { StrengthCard } from './StrengthCard.tsx'
import { YongsinCard } from './YongsinCard.tsx'

export function App() {
  const [input, setInput] = useState<BirthEntry | null>(loadInput)

  const view = useMemo(() => {
    if (!input) return null
    try {
      const result = calculateSaju(input)
      const analysis = analyzeSaju(result)
      const compat = analyzeCompatibility(ME, ME_ANALYSIS, result, analysis, { me: ME_NAME, them: '상대' })
      return { result, analysis, compat }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }, [input])

  return (
    <div className="page">
      <header className="masthead">
        <h1>{ME_NAME}와의 사주 궁합</h1>
        <p>생년월일시와 태어난 지역을 넣으면 {ME_NAME}의 사주와 얼마나 잘 맞는지 풀어 드립니다.</p>
      </header>

      <BirthForm value={input} onSubmit={setInput} />

      {view === null ? null : 'error' in view ? (
        <p className="error">계산할 수 없는 입력입니다: {view.error}</p>
      ) : (
        <main className="results">
          <CompatCard compat={view.compat} />
          <section className="card">
            <h2>{ME_NAME}가 바라는 기운</h2>
            <p>
              {ME_NAME}는 {ME_ANALYSIS.dayMaster.stem}{ELEMENT_KO[ME_ANALYSIS.dayMaster.element]} 일간에{' '}
              {ME_ANALYSIS.strength.level}한 사주라{' '}
              {ME_ANALYSIS.yongsin.favorable.map(e => ELEMENT_KO[e]).join('과 ')} 기운이 도움이 됩니다.
              상대의 사주에 이 기운이 많을수록 곁에 있을 때 힘이 납니다.
            </p>
          </section>
          <h2 className="section-title">내 사주</h2>
          <PillarChart result={view.result} />
          <div className="grid-2">
            <ElementBars analysis={view.analysis} />
            <StrengthCard analysis={view.analysis} />
          </div>
          <YongsinCard analysis={view.analysis} />
        </main>
      )}

      <footer className="footer">
        <p>
          계산 엔진: <a href="https://github.com/rath/orrery">orrery</a> (<code>@orrery/core</code>).
          이 앱은 AGPL-3.0 라이선스를 따릅니다.
        </p>
        <p>
          궁합과 용신은 규칙 기반 추정이며 재미로 보는 참고용입니다. 입력한 생년월일은 서버로 보내지 않고 이 브라우저 안에서만 계산합니다.
          국내 출생은 한국 표준시, 해외 출생은 현지 경도 기준 진태양시로 계산합니다.
        </p>
      </footer>
    </div>
  )
}

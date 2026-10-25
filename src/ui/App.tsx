import { useMemo, useState } from 'react'
import { calculateSaju } from '@orrery/core/saju'
import type { BirthInput } from '@orrery/core/types'
import { analyzeSaju } from '../analysis.ts'
import { buildReport } from '../report.ts'
import { BirthForm, loadInput } from './BirthForm.tsx'
import { PillarChart } from './PillarChart.tsx'
import { ElementBars } from './ElementBars.tsx'
import { StrengthCard } from './StrengthCard.tsx'
import { YongsinCard } from './YongsinCard.tsx'
import { LuckTimeline } from './LuckTimeline.tsx'
import { CopyReport } from './CopyReport.tsx'

export function App() {
  const [input, setInput] = useState<BirthInput>(loadInput)

  const view = useMemo(() => {
    try {
      const result = calculateSaju(input)
      return { result, analysis: analyzeSaju(result), report: buildReport(input) }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }, [input])

  return (
    <div className="page">
      <header className="masthead">
        <h1>사주 분석</h1>
        <p>생년월일시를 넣으면 원국과 오행, 강약, 용신, 운의 흐름을 풀어 드립니다.</p>
      </header>

      <BirthForm value={input} onSubmit={setInput} />

      {'error' in view ? (
        <p className="error">계산할 수 없는 입력입니다: {view.error}</p>
      ) : (
        <main className="results">
          <PillarChart result={view.result} />
          <div className="grid-2">
            <ElementBars analysis={view.analysis} />
            <StrengthCard analysis={view.analysis} />
          </div>
          <YongsinCard analysis={view.analysis} />
          <LuckTimeline result={view.result} analysis={view.analysis} />
          <CopyReport report={view.report} />
        </main>
      )}

      <footer className="footer">
        <p>
          계산 엔진: <a href="https://github.com/rath/orrery">orrery</a> (<code>@orrery/core</code>).
          이 앱은 AGPL-3.0 라이선스를 따릅니다.
        </p>
        <p>강약과 용신은 규칙 기반 추정이며 참고용입니다. 출생 시각은 한국 표준시 기준으로 계산합니다.</p>
      </footer>
    </div>
  )
}

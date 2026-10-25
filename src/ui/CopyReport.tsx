import { useState } from 'react'

export function CopyReport({ report }: { report: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* 클립보드 권한이 없으면 아래 텍스트를 직접 복사 */ }
  }

  return (
    <section className="card">
      <div className="row-between">
        <h2>텍스트 리포트</h2>
        <button type="button" onClick={copy}>{copied ? '복사됨' : '복사하기'}</button>
      </div>
      <p className="note">AI에게 더 자세한 풀이를 물어볼 때 그대로 붙여넣을 수 있는 마크다운입니다.</p>
      <details>
        <summary>리포트 펼치기</summary>
        <pre className="report">{report}</pre>
      </details>
    </section>
  )
}

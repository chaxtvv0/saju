import { ELEMENT_KO, SIPSIN_GROUPS, type SajuAnalysis } from '../analysis.ts'

const LEVEL_TEXT = {
  신강: '일간의 힘이 강한 편입니다. 기운을 쓰고 덜어내는 방향이 좋습니다.',
  중화: '돕는 힘과 빼는 힘이 비슷해 균형에 가깝습니다.',
  신약: '일간의 힘이 약한 편입니다. 돕고 받쳐주는 기운이 필요합니다.',
}

export function StrengthCard({ analysis }: { analysis: SajuAnalysis }) {
  const { dayMaster, strength, sipsinGroups } = analysis
  const marks = [
    ['득령', strength.deukryeong, '월지가 일간을 돕는가'],
    ['득지', strength.deukji, '일지가 일간을 돕는가'],
    ['득세', strength.deukse, '나머지 글자가 일간을 돕는가'],
  ] as const

  return (
    <section className="card">
      <h2>일간과 강약</h2>
      <p className="lead">
        일간 <strong className={`chip ${dayMaster.element}`}>{dayMaster.stem}</strong>{' '}
        {dayMaster.yinyang === '+' ? '양' : '음'}{ELEMENT_KO[dayMaster.element]} ·{' '}
        <strong>{strength.level}</strong>
      </p>
      <div className="gauge" role="img" aria-label={`돕는 힘 ${strength.supportRatio}%`}>
        <span className="zone weak">신약</span>
        <span className="zone mid">중화</span>
        <span className="zone strong">신강</span>
        <span className="needle" style={{ left: `${strength.supportRatio}%` }} />
      </div>
      <p className="note">돕는 힘(비겁+인성) {strength.supportRatio}%. {LEVEL_TEXT[strength.level]}</p>
      <div className="tags">
        {marks.map(([name, ok, hint]) => (
          <span key={name} className={`tag ${ok ? '' : 'muted'}`} title={hint}>{name} {ok ? 'O' : 'X'}</span>
        ))}
      </div>
      <p className="note">
        통근: {strength.roots.length ? strength.roots.join(', ') : '없음'}
        {(analysis.combos.length > 0 || analysis.conflicts.length > 0) && ' · 원국 지지: ' + [
          ...analysis.combos.map(c => `${c.branches} ${c.kind}(${ELEMENT_KO[c.element]}${c.broken ? ', 약화' : ''})`),
          ...analysis.conflicts.map(c => `${c.branches} ${c.kind}`),
        ].join(', ')}
      </p>
      <dl className="groups">
        {SIPSIN_GROUPS.map(g => (
          <div key={g}><dt>{g}</dt><dd>{sipsinGroups[g]}</dd></div>
        ))}
      </dl>
    </section>
  )
}

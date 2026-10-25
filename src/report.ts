/**
 * 분석 결과를 사람이 읽을 수 있는 마크다운 리포트로 만든다.
 * 이 텍스트는 Claude API 풀이 요청의 입력으로도 그대로 쓸 수 있다.
 */
import { calculateSaju } from '@orrery/core/saju'
import type { BirthInput } from '@orrery/core/types'
import {
  analyzeSaju, currentDaewoon, summarizeLuck, yearLuck,
  ELEMENT_KO, SIPSIN_GROUPS, ko,
} from './analysis.ts'

export function buildReport(input: BirthInput, today: Date = new Date()): string {
  const result = calculateSaju(input)
  const a = analyzeSaju(result)
  const lines: string[] = []

  const time = input.unknownTime ? '시간 모름' : `${input.hour}시 ${input.minute}분`
  lines.push(`# 사주 분석 리포트`)
  lines.push(`${input.year}년 ${input.month}월 ${input.day}일 ${time} · ${input.gender === 'M' ? '남' : '여'}`)
  lines.push('')

  lines.push('## 원국')
  lines.push('| | 시주 | 일주 | 월주 | 년주 |')
  lines.push('|---|---|---|---|---|')
  const row = (label: string, f: (i: number) => string) =>
    lines.push(`| ${label} | ${[0, 1, 2, 3].map(f).join(' | ')} |`)
  row('천간', i => result.pillars[i].pillar.stem)
  row('지지', i => result.pillars[i].pillar.branch)
  row('천간 십신', i => ko(result.pillars[i].stemSipsin))
  row('지지 십신', i => ko(result.pillars[i].branchSipsin))
  row('12운성', i => ko(result.pillars[i].unseong))
  lines.push('')

  lines.push('## 오행 분포')
  lines.push('개수는 지지 본기 기준입니다. 가중 점수는 일간을 제외하고 월지 3·일지 1.5·나머지 1로 두되, 지지는 지장간 비율로 나누고 원국의 합을 더했습니다.')
  for (const e of a.elements) {
    lines.push(`- ${ELEMENT_KO[e.element]}: ${e.count}개 (위치 가중 점수 ${e.score})`)
  }
  if (a.missingElements.length > 0) {
    lines.push(`- 없는 오행: ${a.missingElements.map(e => ELEMENT_KO[e]).join(', ')}`)
  }
  lines.push('')

  lines.push('## 일간과 강약')
  const s = a.strength
  lines.push(`- 일간: ${a.dayMaster.stem} (${a.dayMaster.yinyang === '+' ? '양' : '음'}${ELEMENT_KO[a.dayMaster.element]})`)
  lines.push(`- 판단: **${s.level}** (돕는 힘 ${s.supportRatio}%)`)
  lines.push(`- 득령 ${s.deukryeong ? 'O' : 'X'} · 득지 ${s.deukji ? 'O' : 'X'} · 득세 ${s.deukse ? 'O' : 'X'}`)
  lines.push(`- 통근: ${s.roots.length ? s.roots.join(', ') : '없음'}`)
  lines.push(`- 십신 분포: ${SIPSIN_GROUPS.map(g => `${g} ${a.sipsinGroups[g]}`).join(', ')}`)
  if (a.combos.length || a.conflicts.length) {
    const combos = a.combos.map(c => `${c.branches} ${c.kind}(${ELEMENT_KO[c.element]}${c.broken ? ', 충으로 약화' : ''})`)
    const conflicts = a.conflicts.map(c => `${c.branches} ${c.kind}${c.detail ? `(${c.detail})` : ''}`)
    lines.push(`- 원국 지지 관계: ${[...combos, ...conflicts].join(', ')}`)
  }
  lines.push('')

  lines.push('## 용신 (추정)')
  lines.push(`- 도움 되는 오행: ${a.yongsin.favorable.map(e => ELEMENT_KO[e]).join(' > ')}`)
  if (a.yongsin.conditional.length) {
    lines.push(`- 조건부 오행: ${a.yongsin.conditional.map(e => ELEMENT_KO[e]).join(', ')} (조후상 필요해 용신과 함께 오면 좋음)`)
  }
  lines.push(`- 조심할 오행: ${a.yongsin.unfavorable.map(e => ELEMENT_KO[e]).join(', ') || '없음'}`)
  lines.push(`- 근거(억부): ${a.yongsin.reason}`)
  if (a.yongsin.johu) lines.push(`- 조후(궁통보감 ${a.yongsin.johu.stems}): ${a.yongsin.johu.note}`)
  for (const p of a.patterns) lines.push(`- 특수 구도 ${p.name}: ${p.text}`)
  lines.push('')

  lines.push('## 운의 흐름')
  const dw = currentDaewoon(result, today)
  if (dw) {
    const l = summarizeLuck(dw.ganzi, result, a)
    lines.push(`- 현재 대운: ${dw.ganzi} (${dw.age}세~) ${l.stemSipsin}/${l.branchSipsin} → ${l.rating}`)
    if (l.interactions.length) lines.push(`  - ${l.interactions.join(', ')}`)
    for (const n of l.notes) lines.push(`  - ${n}`)
  }
  for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
    const l = yearLuck(y, result, a)
    lines.push(`- ${y}년 세운: ${l.ganzi} ${l.stemSipsin}/${l.branchSipsin} → ${l.rating}`)
    if (l.interactions.length) lines.push(`  - ${l.interactions.join(', ')}`)
    for (const n of l.notes) lines.push(`  - ${n}`)
  }
  lines.push('')
  lines.push('> 강약과 용신은 규칙 기반 추정입니다. 지장간·합·조후·특수 구도를 반영했지만, 합화 성립 여부나 격국은 실제 감정에서 함께 봅니다.')

  return lines.join('\n')
}

/**
 * 사주 해석 엔진
 *
 * @orrery/core 의 계산 결과(SajuResult)를 받아
 * 오행 분포 → 일간 강약 → 용신 후보 → 대운/세운 요약을 만든다.
 * 모든 판단은 규칙 기반 추정이며, 같은 입력에는 항상 같은 결과를 낸다.
 */
import {
  STEM_INFO, BRANCH_ELEMENT, RELATIONS, METEORS_12, JIJANGGAN,
  BRANCH_COMBINES_6, HALF_COMPOSES, TRIPLE_COMPOSES, TRIPLE_COMPOSE_ELEMENTS,
  DIRECTIONAL_COMPOSES, DIRECTIONAL_COMPOSE_ELEMENTS, BRANCH_CLASHES, BRANCH_PUNISHMENTS,
  STEM_COMBINES, STEM_CLASHES,
} from '@orrery/core/constants'
import { getRelation, getJeonggi, getYearGanzi } from '@orrery/core/pillars'
import type { Element, SajuResult, DaewoonItem } from '@orrery/core/types'
import { JOHU_TABLE, URGENT_SEASON, CLASSIC_PATTERNS, type ClassicPattern } from './classics.ts'

// =============================================
// 기본 상수
// =============================================

export const ELEMENTS: Element[] = ['tree', 'fire', 'earth', 'metal', 'water']

export const ELEMENT_KO: Record<Element, string> = {
  tree: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
}

/** 천간·지지의 오행 */
export function elementOf(char: string): Element | undefined {
  return STEM_INFO[char]?.element ?? BRANCH_ELEMENT[char]
}

/** 십신·12운성 한자를 한글로 (本元은 일간 자리) */
export function ko(hanja: string): string {
  if (hanja === '本元') return '일간'
  return [...RELATIONS, ...METEORS_12].find(r => r.hanja === hanja)?.hangul ?? hanja
}

/** 십신 대분류 */
export type SipsinGroup = '비겁' | '식상' | '재성' | '관성' | '인성'
export const SIPSIN_GROUPS: SipsinGroup[] = ['비겁', '식상', '재성', '관성', '인성']

/** 상생 순서상 다음 오행 (내가 생하는 오행) */
function generates(e: Element): Element {
  return ELEMENTS[(ELEMENTS.indexOf(e) + 1) % 5]
}

/** 일간 오행 기준으로 대상 오행이 어느 십신 그룹인지 */
export function groupOf(dayElement: Element, target: Element): SipsinGroup {
  const diff = (ELEMENTS.indexOf(target) - ELEMENTS.indexOf(dayElement) + 5) % 5
  return SIPSIN_GROUPS[diff]
}

/** 일간 오행 기준으로 십신 그룹에 해당하는 오행 */
export function elementOfGroup(dayElement: Element, group: SipsinGroup): Element {
  let e = dayElement
  for (let i = 0; i < SIPSIN_GROUPS.indexOf(group); i++) e = generates(e)
  return e
}

// 위치별 가중치 (시/일/월/년 순서, orrery pillars 배열과 동일)
// 월지는 계절(득령)을 결정하므로 가장 크게, 일지는 일간의 뿌리라서 그다음으로 본다.
const STEM_WEIGHTS = [1, 0, 1, 1]
const BRANCH_WEIGHTS = [1, 1.5, 3, 1]
export const PILLAR_NAMES_KO = ['시주', '일주', '월주', '년주']

/** 지장간 (여기→중기→정기 순) */
export function hiddenStems(branch: string): string[] {
  return [...(JIJANGGAN[branch] ?? '')].filter(c => c !== ' ')
}

/** 지장간 비중. 정기가 대부분이고 여기·중기는 나머지를 나눠 가진다. */
function hiddenWeights(n: number): number[] {
  return n === 3 ? [0.2, 0.2, 0.6] : n === 2 ? [0.3, 0.7] : [1]
}

function pairKey<T>(table: Record<string, T>, a: string, b: string): T | undefined {
  return table[`${a},${b}`] ?? table[`${b},${a}`]
}

const round = (n: number) => Math.round(n * 100) / 100

// =============================================
// 결과 타입
// =============================================

export type StrengthLevel = '신강' | '중화' | '신약'

export interface ElementStat {
  element: Element
  /** 여덟 글자 중 개수 (지지는 본기 오행 기준) */
  count: number
  /** 지장간 비율과 합(合) 보정을 반영한 위치 가중 점수 (일간 제외) */
  score: number
}

/** 원국 지지끼리의 합 */
export interface NatalCombo {
  kind: '육합' | '반합' | '삼합' | '방합'
  branches: string
  element: Element
  /** 오행 점수에 더한 값 */
  bonus: number
  /** 참여한 지지가 충을 맞아 합이 약해졌는지 */
  broken: boolean
}

/** 원국 지지끼리의 충·형 */
export interface NatalConflict {
  kind: '충' | '형'
  branches: string
  detail?: string
}

export interface PatternMatch {
  name: string
  text: string
}

export interface SajuAnalysis {
  dayMaster: { stem: string; element: Element; yinyang: '+' | '-' }
  elements: ElementStat[]
  missingElements: Element[]
  sipsinGroups: Record<SipsinGroup, number>
  combos: NatalCombo[]
  conflicts: NatalConflict[]
  strength: {
    level: StrengthLevel
    /** 일간을 돕는 힘(비겁+인성)의 비율, 0~100 */
    supportRatio: number
    deukryeong: boolean
    deukji: boolean
    deukse: boolean
    /** 일간과 같은 오행이 지장간에 있는 지지 (통근) */
    roots: string[]
  }
  yongsin: {
    /** 우선순위 순 */
    favorable: Element[]
    unfavorable: Element[]
    /** 억부로는 기신이지만 조후상 필요한 오행. 피하기보다 용신과 함께 쓰는 기운 */
    conditional: Element[]
    reason: string
    johu: {
      /** 궁통보감 조후 용신 천간 */
      stems: string
      urgent: boolean
      note: string
    } | null
  }
  /** 원국에서 성립한 특수 구도 */
  patterns: PatternMatch[]
}

// =============================================
// 분석
// =============================================

/** 원국 지지의 합·충·형 */
function natalBranchRelations(branches: (string | undefined)[]) {
  const combos: NatalCombo[] = []
  const conflicts: NatalConflict[] = []
  const at = branches.map((b, i) => ({ b, i })).filter((x): x is { b: string; i: number } => !!x.b)
  const present = new Set(at.map(x => x.b))

  const clashed = new Set<string>()
  for (let x = 0; x < at.length; x++) {
    for (let y = x + 1; y < at.length; y++) {
      const [a, b] = [at[x].b, at[y].b]
      if (pairKey(BRANCH_CLASHES, a, b)) {
        clashed.add(a); clashed.add(b)
        conflicts.push({ kind: '충', branches: `${a}${b}` })
      }
      const p = pairKey(BRANCH_PUNISHMENTS, a, b)
      if (p) conflicts.push({ kind: '형', branches: `${a}${b}`, detail: p[1] })
    }
  }

  const add = (kind: NatalCombo['kind'], chars: string[], element: Element, base: number) => {
    const broken = chars.some(c => clashed.has(c))
    combos.push({ kind, branches: chars.join(''), element, bonus: broken ? base / 2 : base, broken })
  }

  const fullTriple = new Set<Element>()
  for (const t of TRIPLE_COMPOSES) {
    if (t.every(c => present.has(c))) {
      const e = TRIPLE_COMPOSE_ELEMENTS[t.join(',')] as Element
      fullTriple.add(e)
      add('삼합', t, e, 2)
    }
  }
  for (const t of DIRECTIONAL_COMPOSES) {
    if (t.every(c => present.has(c))) add('방합', t, DIRECTIONAL_COMPOSE_ELEMENTS[t.join(',')] as Element, 2)
  }
  for (let x = 0; x < at.length; x++) {
    for (let y = x + 1; y < at.length; y++) {
      const [a, b] = [at[x], at[y]]
      // 붙어 있는 지지끼리의 합이 온전하고, 떨어져 있으면 절반만 본다
      const base = Math.abs(a.i - b.i) === 1 ? 1 : 0.5
      const six = pairKey(BRANCH_COMBINES_6, a.b, b.b)
      if (six) add('육합', [a.b, b.b], six[1] as Element, base)
      const half = pairKey(HALF_COMPOSES, a.b, b.b)
      if (half && !fullTriple.has(half[1] as Element)) add('반합', [a.b, b.b], half[1] as Element, base)
    }
  }
  return { combos, conflicts }
}

export function analyzeSaju(result: SajuResult): SajuAnalysis {
  const pillars = result.pillars
  const dayStem = pillars[1].pillar.stem
  const dm = STEM_INFO[dayStem]
  const branchAt = (i: number) => BRANCH_ELEMENT[pillars[i].pillar.branch] ? pillars[i].pillar.branch : undefined

  const count = Object.fromEntries(ELEMENTS.map(e => [e, 0])) as Record<Element, number>
  const score = Object.fromEntries(ELEMENTS.map(e => [e, 0])) as Record<Element, number>
  const roots: string[] = []

  pillars.forEach((p, i) => {
    const stem = STEM_INFO[p.pillar.stem]
    if (stem) {
      count[stem.element]++
      score[stem.element] += STEM_WEIGHTS[i]
    }
    const branch = branchAt(i)
    if (branch) {
      count[BRANCH_ELEMENT[branch]]++
      const hidden = hiddenStems(branch)
      const w = hiddenWeights(hidden.length)
      hidden.forEach((h, k) => { score[STEM_INFO[h].element] += BRANCH_WEIGHTS[i] * w[k] })
      if (hidden.some(h => STEM_INFO[h].element === dm.element)) roots.push(`${PILLAR_NAMES_KO[i]} ${branch}`)
    }
  })

  const { combos, conflicts } = natalBranchRelations([0, 1, 2, 3].map(branchAt))
  for (const c of combos) score[c.element] += c.bonus
  for (const e of ELEMENTS) score[e] = round(score[e])

  const groups = Object.fromEntries(SIPSIN_GROUPS.map(g => [g, 0])) as Record<SipsinGroup, number>
  for (const e of ELEMENTS) groups[groupOf(dm.element, e)] = round(groups[groupOf(dm.element, e)] + score[e])

  const total = SIPSIN_GROUPS.reduce((s, g) => s + groups[g], 0)
  const support = groups['비겁'] + groups['인성']
  const supportRatio = total > 0 ? Math.round((support / total) * 100) : 50

  const isSupport = (e: Element | undefined) =>
    e !== undefined && ['비겁', '인성'].includes(groupOf(dm.element, e))
  const deukryeong = isSupport(BRANCH_ELEMENT[pillars[2].pillar.branch])
  const deukji = isSupport(BRANCH_ELEMENT[pillars[1].pillar.branch])
  // 월지·일지를 뺀 나머지 글자에서 돕는 쪽이 절반 이상이면 득세
  const rest = pillars.flatMap((p, i) => [
    i !== 1 ? STEM_INFO[p.pillar.stem]?.element : undefined,
    i === 0 || i === 3 ? BRANCH_ELEMENT[p.pillar.branch] : undefined,
  ]).filter((e): e is Element => e !== undefined)
  const deukse = rest.length > 0 && rest.filter(isSupport).length * 2 >= rest.length

  const level: StrengthLevel = supportRatio >= 55 ? '신강' : supportRatio < 45 ? '신약' : '중화'

  const stems = pillars.map((p, i) => (i === 1 ? '' : p.pillar.stem)).filter(s => STEM_INFO[s])
  const patterns = CLASSIC_PATTERNS
    .filter(p => p.dayStem === dayStem && p.needs.every(n => stems.includes(n)))
    .map(p => ({ name: p.name, text: p.text }))

  return {
    dayMaster: { stem: dayStem, element: dm.element, yinyang: dm.yinyang },
    elements: ELEMENTS.map(e => ({ element: e, count: count[e], score: score[e] })),
    missingElements: ELEMENTS.filter(e => count[e] === 0),
    sipsinGroups: groups,
    combos,
    conflicts,
    strength: { level, supportRatio, deukryeong, deukji, deukse, roots },
    yongsin: pickYongsin(dayStem, level, groups, score, pillars[2].pillar.branch),
    patterns,
  }
}

/** 억부(抑扶) 기준 용신 후보에 궁통보감 조후를 겹쳐 본다 */
function pickYongsin(
  dayStem: string,
  level: StrengthLevel,
  groups: Record<SipsinGroup, number>,
  score: Record<Element, number>,
  monthBranch: string,
): SajuAnalysis['yongsin'] {
  const dayElement = STEM_INFO[dayStem].element
  const el = (g: SipsinGroup) => elementOfGroup(dayElement, g)
  let order: SipsinGroup[]
  let reason: string

  if (level === '신강') {
    if (groups['비겁'] >= groups['인성']) {
      order = ['관성', '식상', '재성']
      reason = '비겁이 많아 신강하므로, 일간을 제어하는 관성과 힘을 빼주는 식상·재성이 도움이 됩니다.'
    } else {
      order = ['재성', '식상', '관성']
      reason = '인성이 많아 신강하므로, 인성을 누르는 재성과 기운을 흘려보내는 식상이 도움이 됩니다.'
    }
  } else if (level === '신약') {
    if (groups['재성'] >= groups['관성'] && groups['재성'] >= groups['식상']) {
      order = ['비겁', '인성']
      reason = groups['재성'] - groups['식상'] < 0.5
        ? '재성과 식상이 함께 강해 일간이 약하므로, 이를 감당하게 해주는 비겁과 인성이 필요합니다.'
        : '재성이 강해 일간이 약하므로, 재성을 감당하게 해주는 비겁이 먼저 필요합니다.'
    } else {
      order = ['인성', '비겁']
      reason = groups['관성'] >= groups['식상']
        ? '관성이 강해 일간이 약하므로, 관성의 힘을 일간으로 이어주는 인성이 먼저 필요합니다.'
        : '식상이 강해 기운이 새어 나가므로, 식상을 누르고 일간을 돕는 인성이 먼저 필요합니다.'
    }
  } else {
    const weakest = [...ELEMENTS].sort((a, b) => score[a] - score[b])[0]
    order = [groupOf(dayElement, weakest)]
    reason = `균형에 가까운 사주라 가장 부족한 ${ELEMENT_KO[weakest]} 기운을 보충하는 것이 좋습니다.`
  }

  let favorable = order.map(el)
  let conditional: Element[] = []
  let johu: SajuAnalysis['yongsin']['johu'] = null

  const johuStems = JOHU_TABLE[dayStem]?.[monthBranch]
  if (johuStems) {
    const urgent = URGENT_SEASON.includes(monthBranch)
    // 앞의 두 글자만 조후 용신으로 본다. 세 번째부터는 조건부 보조라 판단에 넣지 않는다.
    const [first, ...others] = [...johuStems.slice(0, 2)].map(s => STEM_INFO[s].element)
    let note: string
    if (favorable[0] === first) {
      note = `조후 용신(${johuStems[0]})과 억부 용신이 같은 ${ELEMENT_KO[first]} 기운이라 판단이 일치합니다.`
    } else if (favorable.includes(first)) {
      favorable = [first, ...favorable.filter(e => e !== first)]
      note = `조후상 ${ELEMENT_KO[first]} 기운(${johuStems[0]})이 먼저라 순서를 앞당겼습니다.`
    } else if (urgent) {
      favorable = [first, ...favorable]
      note = `${'巳午未'.includes(monthBranch) ? '여름' : '겨울'} 태생이라 조후가 급하므로 ${ELEMENT_KO[first]} 기운(${johuStems[0]})을 가장 먼저 씁니다.`
    } else {
      note = `조후로는 ${ELEMENT_KO[first]} 기운(${johuStems[0]})이 필요해 함께 고려합니다.`
    }
    conditional = [...new Set([first, ...others])].filter(e => !favorable.includes(e))
    johu = { stems: johuStems, urgent, note }
  }

  const unfavorable = SIPSIN_GROUPS.map(el).filter(e => !favorable.includes(e) && !conditional.includes(e))
  return { favorable, unfavorable, conditional, reason, johu }
}

// =============================================
// 운의 흐름
// =============================================

export interface LuckSummary {
  ganzi: string
  stemSipsin: string
  branchSipsin: string
  /** 용신/기신과 원국과의 관계를 합산한 평가 */
  rating: '좋음' | '보통' | '주의'
  score: number
  /** 원국과의 합·충·형 */
  interactions: string[]
  /** 평가에 영향을 준 해석 메모 */
  notes: string[]
}

/** 특수 구도 중 운의 천간이 들어와 완성되는 것 */
function patternsCompletedBy(stem: string, natalStems: string[], dayStem: string): ClassicPattern[] {
  return CLASSIC_PATTERNS.filter(p =>
    p.dayStem === dayStem && p.needs.includes(stem) && p.needs.every(n => n === stem || natalStems.includes(n)))
}

export function summarizeLuck(ganzi: string, result: SajuResult, analysis: SajuAnalysis): LuckSummary {
  const dayStem = analysis.dayMaster.stem
  const [stem, branch] = [ganzi[0], ganzi[1]]
  const { favorable, conditional } = analysis.yongsin
  const valueOf = (e: Element | undefined) =>
    e === undefined || conditional.includes(e) ? 0 : favorable.includes(e) ? 1 : -1

  const interactions: string[] = []
  const notes: string[] = []
  let score = 0

  // 지지가 운의 실제 환경이라 천간보다 무겁게 본다
  score += valueOf(STEM_INFO[stem]?.element) + 2 * valueOf(BRANCH_ELEMENT[branch])

  // 기신이라도 용신을 생해 주고, 그 용신이 이미 있으면 통관(관인상생 등)으로 본다
  const top = favorable[0]
  const topPresent = (analysis.elements.find(e => e.element === top)?.score ?? 0) >= 1 ||
    STEM_INFO[stem]?.element === top
  const comboValue = (e: Element, label: string) => {
    const v = valueOf(e)
    if (v < 0 && generates(e) === top && topPresent) {
      notes.push(`${label}으로 ${ELEMENT_KO[e]} 기운이 커지지만, 용신 ${ELEMENT_KO[top]} 쪽으로 이어지는 흐름(통관)이라 부담이 줄어듭니다.`)
      return 0
    }
    return v
  }

  const natal = result.pillars.map(p => ({ stem: p.pillar.stem, branch: p.pillar.branch }))
  const otherStems = natal.filter((p, i) => i !== 1 && STEM_INFO[p.stem]).map(p => p.stem)
  const natalBranches = natal.map(p => p.branch).filter(b => BRANCH_ELEMENT[b])

  // 특수 구도
  const patterns = patternsCompletedBy(stem, otherStems, dayStem)
  const excusedClash = new Set(patterns.map(p => p.clash).filter((c): c is string => !!c))
  for (const p of patterns) {
    score += 1
    notes.push(`${p.name}: ${p.text}`)
  }

  // 삼합: 운의 지지가 원국 두 지지와 만나 완성
  const tripleElements = new Set<Element>()
  for (const t of TRIPLE_COMPOSES) {
    if (!t.includes(branch)) continue
    const others = t.filter(c => c !== branch)
    if (others.every(c => natalBranches.includes(c)) && !natalBranches.includes(branch)) {
      const e = TRIPLE_COMPOSE_ELEMENTS[t.join(',')] as Element
      tripleElements.add(e)
      interactions.push(`${t.join('')} 삼합(${ELEMENT_KO[e]})`)
      score += 1.5 * comboValue(e, '삼합')
    }
  }

  let stemClashCounted = false
  natal.forEach((p, i) => {
    const name = PILLAR_NAMES_KO[i]
    if (STEM_INFO[p.stem]) {
      const combine = pairKey(STEM_COMBINES, stem, p.stem)
      if (combine) {
        const e = combine[1] as Element
        interactions.push(`${name} 천간합(${ELEMENT_KO[e]})`)
        score += 0.5 * valueOf(e)
      }
      if (pairKey(STEM_CLASHES, stem, p.stem)) {
        interactions.push(`${name} 천간충`)
        const key = [stem, p.stem].sort().join('')
        const excused = [...excusedClash].some(c => [...c].sort().join('') === key)
        if (!excused && !stemClashCounted) {
          score -= i === 1 ? 1 : 0.5
          stemClashCounted = true
        }
      }
    }
    if (!BRANCH_ELEMENT[p.branch]) return
    const heavy = i === 1 || i === 2
    const six = pairKey(BRANCH_COMBINES_6, branch, p.branch)
    if (six) {
      const e = six[1] as Element
      interactions.push(`${name} 지지합(${ELEMENT_KO[e]})`)
      score += comboValue(e, '육합')
    }
    const half = pairKey(HALF_COMPOSES, branch, p.branch)
    if (half && !tripleElements.has(half[1] as Element)) {
      const e = half[1] as Element
      interactions.push(`${name} 반합(${ELEMENT_KO[e]})`)
      score += comboValue(e, '반합')
    }
    if (pairKey(BRANCH_CLASHES, branch, p.branch)) {
      interactions.push(`${name} 지지충`)
      const target = BRANCH_ELEMENT[p.branch]
      if (valueOf(target) < 0) {
        notes.push(`${name} 충: 대상(${p.branch})이 기신이라 변화·이동 정도로 봅니다.`)
      } else {
        score -= heavy ? 1 : 0.5
      }
    }
    const pun = pairKey(BRANCH_PUNISHMENTS, branch, p.branch)
    if (pun) {
      interactions.push(`${name} 지지형(${pun[1]})`)
      score -= heavy ? 0.75 : 0.5
    }
  })

  score = round(score)
  return {
    ganzi,
    stemSipsin: getRelation(dayStem, stem)?.hangul ?? '',
    branchSipsin: getRelation(dayStem, getJeonggi(branch))?.hangul ?? '',
    rating: score >= 1 ? '좋음' : score <= -1 ? '주의' : '보통',
    score,
    interactions,
    notes,
  }
}

/** 주어진 날짜에 해당하는 대운 */
export function currentDaewoon(result: SajuResult, date: Date = new Date()): DaewoonItem | undefined {
  const t = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return [...result.daewoon].reverse().find(d => d.startDate.getTime() <= t)
}

/** 세운(연운) 요약 */
export function yearLuck(year: number, result: SajuResult, analysis: SajuAnalysis): LuckSummary {
  return summarizeLuck(getYearGanzi(year), result, analysis)
}

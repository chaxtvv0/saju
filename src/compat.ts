/**
 * 궁합 엔진
 *
 * 기준 원국(차차)과 상대 원국을 받아 다섯 가지 관점에서 점수를 매긴다.
 *  1. 일간끼리의 관계 (서로의 본성)
 *  2. 일지끼리의 관계 (배우자궁)
 *  3. 년지끼리의 관계 (띠)
 *  4. 상대가 나의 용신을 채워 주는지
 *  5. 내가 상대의 용신을 채워 주는지
 * 모든 판단은 규칙 기반 추정이며, 같은 입력에는 항상 같은 결과를 낸다.
 */
import {
  STEM_INFO, BRANCH_COMBINES_6, HALF_COMPOSES, BRANCH_CLASHES, BRANCH_PUNISHMENTS,
  BRANCH_WONJIN, BRANCH_HARMS, BRANCH_SELF_PUNISHMENTS, STEM_COMBINES, STEM_CLASHES,
} from '@orrery/core/constants'
import { getRelation } from '@orrery/core/pillars'
import type { Element } from '@orrery/core/types'
import { ELEMENTS, ELEMENT_KO, type NatalPillars, type SajuAnalysis } from './analysis.ts'

export interface CompatItem {
  title: string
  /** 대략 -3 ~ +3 */
  score: number
  summary: string
  detail: string
}

export interface Compatibility {
  /** 0~100 */
  total: number
  grade: '아주 잘 맞음' | '잘 맞음' | '무난함' | '노력이 필요함'
  items: CompatItem[]
  /** 서로가 상대에게 어떤 십신인지 */
  roles: { meToThem: string; themToMe: string }
}

function pairKey<T>(table: Record<string, T>, a: string, b: string): T | undefined {
  return table[`${a},${b}`] ?? table[`${b},${a}`]
}

const round = (n: number) => Math.round(n * 100) / 100
const generates = (e: Element) => ELEMENTS[(ELEMENTS.indexOf(e) + 1) % 5]
const controls = (e: Element) => ELEMENTS[(ELEMENTS.indexOf(e) + 2) % 5]

/** 목·금은 받침이 있어 '이/을', 화·토·수는 '가/를' */
const hasBatchim = (e: Element) => e === 'tree' || e === 'metal'
const subj = (e: Element) => `${ELEMENT_KO[e]}${hasBatchim(e) ? '이' : '가'}`
const obj = (e: Element) => `${ELEMENT_KO[e]}${hasBatchim(e) ? '을' : '를'}`

/** 십신을 관계 맥락으로 풀어 쓴 짧은 설명 */
const ROLE_TEXT: Record<string, string> = {
  비견: '나란히 걷는 친구 같은 사람',
  겁재: '경쟁하며 자극을 주는 사람',
  식신: '편하게 마음을 표현하게 해 주는 사람',
  상관: '재치와 말로 끌어내 주는 사람',
  편재: '활동 무대를 넓혀 주는 사람',
  정재: '현실을 차곡차곡 함께 꾸리는 사람',
  편관: '긴장감 있게 끌어 주는 사람',
  정관: '바르고 믿음직하게 기대게 되는 사람',
  편인: '독특한 시각으로 영감을 주는 사람',
  정인: '보살피고 지지해 주는 사람',
}

// ---------------------------------------------
// 1. 일간
// ---------------------------------------------
function dayStemItem(mine: string, theirs: string): CompatItem {
  const me = STEM_INFO[mine].element
  const them = STEM_INFO[theirs].element
  const title = '일간 궁합 (서로의 본성)'
  const pair = `${mine}·${theirs}`

  const combine = pairKey(STEM_COMBINES, mine, theirs)
  if (combine) {
    return {
      title, score: 3, summary: `${pair} 천간합`,
      detail: `두 일간이 합을 이뤄 ${ELEMENT_KO[combine[1] as Element]} 기운으로 묶입니다. 처음부터 끌림이 강하고 서로에게 자연스럽게 맞춰 가는 조합입니다.`,
    }
  }
  if (pairKey(STEM_CLASHES, mine, theirs)) {
    return {
      title, score: -2, summary: `${pair} 천간충`,
      detail: '두 일간이 정면으로 부딪치는 관계라 생각과 속도가 자주 엇갈립니다. 서로 다른 점을 인정하면 오히려 자극이 되기도 합니다.',
    }
  }
  if (generates(them) === me) {
    return {
      title, score: 2, summary: `${subj(them)} ${obj(me)} 생함`,
      detail: '상대의 기운이 나를 살려 주는 상생 관계입니다. 곁에 있으면 힘이 나고 든든하게 느껴집니다.',
    }
  }
  if (generates(me) === them) {
    return {
      title, score: 1, summary: `${subj(me)} ${obj(them)} 생함`,
      detail: '내가 상대를 챙기고 키워 주는 상생 관계입니다. 마음은 잘 통하지만, 한쪽만 주는 관계가 되지 않게 균형을 보는 것이 좋습니다.',
    }
  }
  if (me === them) {
    return {
      title, score: 1, summary: `같은 ${ELEMENT_KO[me]} 일간`,
      detail: '같은 오행이라 성향이 닮아 이해가 빠릅니다. 다만 고집이 같은 방향으로 커지면 양보가 어려울 수 있습니다.',
    }
  }
  if (controls(them) === me) {
    return {
      title, score: -1, summary: `${subj(them)} ${obj(me)} 극함`,
      detail: '상대의 기운이 나를 누르는 관계입니다. 상대가 주도권을 잡기 쉬워 내가 위축되지 않게 마음을 표현하는 것이 중요합니다.',
    }
  }
  return {
    title, score: 0, summary: `${subj(me)} ${obj(them)} 극함`,
    detail: '내가 상대를 다루는 관계입니다. 내가 이끄는 편이 되기 쉬워, 상대의 속도를 존중하면 무난합니다.',
  }
}

// ---------------------------------------------
// 2·3. 지지 (일지·년지)
// ---------------------------------------------
function branchRelation(a: string, b: string): { score: number; summary: string; detail: string } {
  const six = pairKey(BRANCH_COMBINES_6, a, b)
  if (six) return { score: 3, summary: `${a}${b} 육합`, detail: '서로 끌어당기는 합이라 정이 깊고 함께 있을 때 편안합니다.' }
  const half = pairKey(HALF_COMPOSES, a, b)
  if (half) return { score: 2, summary: `${a}${b} 반합`, detail: `${ELEMENT_KO[half[1] as Element]} 기운으로 뜻을 모으는 합이라 같은 목표를 향해 가기 좋습니다.` }
  if (pairKey(BRANCH_CLASHES, a, b)) return { score: -3, summary: `${a}${b} 충`, detail: '정면으로 부딪치는 관계라 생활 리듬이나 기대가 엇갈리기 쉽습니다. 충돌이 생기면 바로 풀고 넘어가는 습관이 필요합니다.' }
  const pun = pairKey(BRANCH_PUNISHMENTS, a, b)
  if (pun) return { score: -2, summary: `${a}${b} 형`, detail: '서로를 다그치기 쉬운 관계입니다. 가까울수록 말투와 배려에 신경 쓰면 좋습니다.' }
  if (pairKey(BRANCH_WONJIN, a, b)) return { score: -1.5, summary: `${a}${b} 원진`, detail: '이유 없이 서운함이 쌓이기 쉬운 관계입니다. 작은 불만을 미루지 않고 이야기하는 것이 좋습니다.' }
  if (pairKey(BRANCH_HARMS, a, b)) return { score: -1, summary: `${a}${b} 해`, detail: '은근히 서로의 일을 방해하기 쉬운 관계라 역할을 분명히 나누면 좋습니다.' }
  if (a === b && BRANCH_SELF_PUNISHMENTS.has(a)) return { score: -1, summary: `${a}${b} 자형`, detail: '같은 글자가 서로를 찌르는 자형이라, 닮은 단점이 부딪치기 쉽습니다. 서로에게 여유를 주면 좋습니다.' }
  if (a === b) return { score: 0.5, summary: `같은 ${a}`, detail: '같은 글자라 생활 방식이 닮아 편합니다.' }
  return { score: 0, summary: `${a}·${b} 특별한 합충 없음`, detail: '크게 끌어당기거나 부딪치는 작용이 없어 무난한 관계입니다.' }
}

function branchItem(title: string, a: string | undefined, b: string | undefined, weight: number): CompatItem {
  if (!a || !b || a === '?' || b === '?') {
    return { title, score: 0, summary: '판단 보류', detail: '태어난 시각을 몰라 이 항목은 보지 않습니다.' }
  }
  const r = branchRelation(a, b)
  return { title, ...r, score: r.score * weight }
}

// ---------------------------------------------
// 4·5. 용신 보완
// ---------------------------------------------

/** 원국의 오행 비율 (지장간 가중 점수 + 일간 1) */
function elementShare(analysis: SajuAnalysis): Record<Element, number> {
  const raw = Object.fromEntries(analysis.elements.map(e => [e.element, e.score])) as Record<Element, number>
  raw[analysis.dayMaster.element] += 1
  const total = ELEMENTS.reduce((s, e) => s + raw[e], 0)
  return Object.fromEntries(ELEMENTS.map(e => [e, total > 0 ? raw[e] / total : 0.2])) as Record<Element, number>
}

function yongsinItem(title: string, receiver: SajuAnalysis, giver: SajuAnalysis): CompatItem {
  const share = elementShare(giver)
  const { favorable, unfavorable } = receiver.yongsin
  // 1순위 용신을 더 무겁게 본다
  const fav = favorable.reduce((s, e, i) => s + share[e] * (i === 0 ? 1.5 : 1), 0)
  const unfav = unfavorable.reduce((s, e) => s + share[e], 0)
  // 오행이 고르게 퍼진 원국을 0점 근처로 맞춘다
  const baseline = (favorable.length ? 0.2 * (favorable.length + 0.5) : 0) - 0.2 * unfavorable.length
  const score = Math.max(-3, Math.min(3, round((fav - unfav - baseline) * 8)))

  const strongest = [...ELEMENTS].sort((x, y) => share[y] - share[x])[0]
  const favText = favorable.map(e => ELEMENT_KO[e]).join('·')
  const summary = `${favText} 비중 ${Math.round(favorable.reduce((s, e) => s + share[e], 0) * 100)}%`
  let detail: string
  if (score >= 1) detail = `필요한 ${favText} 기운을 넉넉히 가지고 있어 곁에 있을수록 기운이 채워집니다.`
  else if (score <= -1) detail = `필요한 ${favText} 기운보다 ${ELEMENT_KO[strongest]} 기운이 강해, 함께 있으면 피로해지기 쉽습니다. 서로 쉬는 시간을 존중하면 좋습니다.`
  else detail = `필요한 ${favText} 기운을 어느 정도 가지고 있어 크게 보태지도 빼앗지도 않는 관계입니다.`
  return { title, score, summary, detail }
}

// ---------------------------------------------
// 종합
// ---------------------------------------------

export function analyzeCompatibility(
  me: NatalPillars, meAnalysis: SajuAnalysis,
  them: NatalPillars, themAnalysis: SajuAnalysis,
  /** 받침 없는 이름 (뒤에 '가'를 붙인다) */
  names: { me: string; them: string } = { me: '내', them: '상대' },
): Compatibility {
  const mine = me.pillars.map(p => p.pillar)
  const theirs = them.pillars.map(p => p.pillar)

  const items: CompatItem[] = [
    dayStemItem(mine[1].stem, theirs[1].stem),
    branchItem('일지 궁합 (배우자궁)', mine[1].branch, theirs[1].branch, 1),
    branchItem('띠 궁합 (년지)', mine[3].branch, theirs[3].branch, 0.5),
    yongsinItem(`${names.them}가 ${names.me}에게 주는 기운`, meAnalysis, themAnalysis),
    yongsinItem(`${names.me}가 ${names.them}에게 주는 기운`, themAnalysis, meAnalysis),
  ]

  const raw = items.reduce((s, i) => s + i.score, 0)
  const total = Math.round(Math.max(30, Math.min(98, 62 + raw * 3)))
  const grade: Compatibility['grade'] =
    total >= 82 ? '아주 잘 맞음' : total >= 68 ? '잘 맞음' : total >= 52 ? '무난함' : '노력이 필요함'

  const role = (day: string, target: string) => getRelation(day, target)?.hangul ?? ''
  return {
    total,
    grade,
    items,
    roles: { meToThem: role(theirs[1].stem, mine[1].stem), themToMe: role(mine[1].stem, theirs[1].stem) },
  }
}

export function roleText(sipsin: string): string {
  return ROLE_TEXT[sipsin] ?? ''
}

import { describe, it, expect } from 'vitest'
import { calculateSaju } from '@orrery/core/saju'
import { analyzeSaju, groupOf, elementOfGroup, yearLuck, currentDaewoon, summarizeLuck } from '../src/analysis.ts'
import { buildReport } from '../src/report.ts'

const sample = { year: 1993, month: 3, day: 12, hour: 9, minute: 45, gender: 'M' as const }

describe('십신 그룹', () => {
  it('일간 오행 기준으로 그룹을 판정한다', () => {
    expect(groupOf('water', 'water')).toBe('비겁')
    expect(groupOf('water', 'tree')).toBe('식상')
    expect(groupOf('water', 'fire')).toBe('재성')
    expect(groupOf('water', 'earth')).toBe('관성')
    expect(groupOf('water', 'metal')).toBe('인성')
  })

  it('groupOf 와 elementOfGroup 은 서로 역관계다', () => {
    for (const d of ['tree', 'fire', 'earth', 'metal', 'water'] as const) {
      for (const g of ['비겁', '식상', '재성', '관성', '인성'] as const) {
        expect(groupOf(d, elementOfGroup(d, g))).toBe(g)
      }
    }
  })
})

describe('analyzeSaju', () => {
  const result = calculateSaju(sample)
  const a = analyzeSaju(result)

  it('오행 개수의 합은 8이다', () => {
    expect(a.elements.reduce((s, e) => s + e.count, 0)).toBe(8)
  })

  it('乙卯월 壬일간은 식상 과다 신약, 인성(金)이 1순위 용신이다', () => {
    expect(a.dayMaster.stem).toBe('壬')
    expect(a.strength.level).toBe('신약')
    expect(a.strength.deukryeong).toBe(false)
    expect(a.yongsin.favorable[0]).toBe('metal')
  })

  it('세운과 대운을 계산한다', () => {
    expect(yearLuck(2026, result, a).ganzi).toBe('丙午')
    expect(currentDaewoon(result, new Date(2026, 0, 1))?.ganzi).toBe('辛亥')
  })

  it('시간 모름이면 시주를 빼고 여섯 글자만 센다', () => {
    const u = analyzeSaju(calculateSaju({ ...sample, unknownTime: true }))
    expect(u.elements.reduce((s, e) => s + e.count, 0)).toBe(6)
    expect(buildReport({ ...sample, unknownTime: true })).toContain('시간 모름')
  })
})

describe('고전 규칙 보정 (丁卯일 戌월 예시)', () => {
  const result = calculateSaju({ year: 2000, month: 11, day: 5, hour: 0, minute: 38, gender: 'F' })
  const a = analyzeSaju(result)

  it('지장간 통근과 원국의 합·충을 찾는다', () => {
    expect(a.strength.roots).toContain('월주 戌')
    expect(a.combos.map(c => c.branches)).toContain('卯戌')
    expect(a.conflicts.map(c => c.branches)).toContain('戌辰')
    expect(a.combos.find(c => c.branches === '卯戌')?.broken).toBe(true)
  })

  it('궁통보감 조후로 甲木이 1순위, 庚金은 조건부다', () => {
    expect(a.strength.level).toBe('신약')
    expect(a.yongsin.johu?.stems.startsWith('甲庚')).toBe(true)
    expect(a.yongsin.favorable[0]).toBe('tree')
    expect(a.yongsin.conditional).toContain('metal')
    expect(a.yongsin.unfavorable).not.toContain('metal')
  })

  it('甲申 대운은 庚劈甲引丁과 통관으로 좋게 본다', () => {
    const l = summarizeLuck('甲申', result, a)
    expect(l.interactions).toContain('申子辰 삼합(수(水))')
    expect(l.notes.some(n => n.startsWith('庚劈甲引丁'))).toBe(true)
    expect(l.rating).toBe('좋음')
  })

  it('기신을 충하는 세운은 감점하지 않고, 형은 감점한다', () => {
    const y2026 = yearLuck(2026, result, a)
    expect(y2026.interactions).toContain('시주 지지충')
    expect(y2026.rating).toBe('좋음')
    const y2027 = yearLuck(2027, result, a)
    expect(y2027.interactions).toContain('일주 반합(목(木))')
    expect(y2027.rating).toBe('보통')
  })
})

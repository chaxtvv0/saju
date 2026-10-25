import { describe, it, expect } from 'vitest'
import { calculateSaju } from '@orrery/core/saju'
import { analyzeSaju } from '../src/analysis.ts'
import { analyzeCompatibility } from '../src/compat.ts'
import { ME, ME_ANALYSIS } from '../src/me.ts'
import { BIRTH_PLACES, findPlace } from '../src/cities.ts'

const compat = (input: Parameters<typeof calculateSaju>[0]) => {
  const r = calculateSaju(input)
  return analyzeCompatibility(ME, ME_ANALYSIS, r, analyzeSaju(r))
}

describe('기준 원국', () => {
  it('간지만으로 丁 일간 신약, 용신 木>火 를 재현한다', () => {
    expect(ME_ANALYSIS.dayMaster.stem).toBe('丁')
    expect(ME_ANALYSIS.strength.level).toBe('신약')
    expect(ME_ANALYSIS.yongsin.favorable).toEqual(['tree', 'fire'])
  })
})

describe('analyzeCompatibility', () => {
  // 1993-03-12 09:45 → 壬일간 (丁壬 천간합)
  const c = compat({ year: 1993, month: 3, day: 12, hour: 9, minute: 45, gender: 'M' })

  it('丁壬 일간은 천간합으로 가장 높은 일간 점수를 받는다', () => {
    expect(c.items[0].summary).toContain('천간합')
    expect(c.items[0].score).toBe(3)
  })

  it('점수는 30~98 사이이고 다섯 항목을 낸다', () => {
    expect(c.items).toHaveLength(5)
    expect(c.total).toBeGreaterThanOrEqual(30)
    expect(c.total).toBeLessThanOrEqual(98)
  })

  it('壬은 丁에게 정관, 丁은 壬에게 정재다', () => {
    expect(c.roles.themToMe).toBe('정관')
    expect(c.roles.meToThem).toBe('정재')
  })

  it('시간 모름이어도 계산된다', () => {
    const u = compat({ year: 1993, month: 3, day: 12, hour: 12, minute: 0, gender: 'M', unknownTime: true })
    expect(u.items).toHaveLength(5)
  })
})

describe('출생지', () => {
  it('국내 도시는 KST 기준(타임존 없음), 해외 도시는 IANA 타임존을 쓴다', () => {
    expect(findPlace('서울')?.timezone).toBeUndefined()
    expect(findPlace('뉴욕, 미국')?.timezone).toBe('America/New_York')
    expect(findPlace('퍼스, 호주')?.timezone).toBe('Australia/Perth')
  })

  it('모든 출생지의 타임존이 유효하다', () => {
    for (const p of BIRTH_PLACES) {
      if (p.timezone) expect(() => new Intl.DateTimeFormat('ko', { timeZone: p.timezone })).not.toThrow()
    }
  })
})

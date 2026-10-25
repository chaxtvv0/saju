/**
 * 궁합의 기준이 되는 차차의 원국.
 *
 * 공개 저장소·공개 페이지라서 생년월일시 원본은 두지 않고, 계산에 필요한 여덟 글자만 둔다.
 * (시·일·월·년 순서, orrery pillars 배열과 동일)
 */
import { analyzeSaju, type NatalPillars } from './analysis.ts'

export const ME_NAME = '차차'
export const ME_GENDER = 'F' as const
export const ME_GANZI = ['庚子', '丁卯', '丙戌', '庚辰'] as const

export const ME: NatalPillars = {
  pillars: ME_GANZI.map(g => ({ pillar: { stem: g[0], branch: g[1] } })),
}

export const ME_ANALYSIS = analyzeSaju(ME)

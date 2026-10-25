import { toHangul } from '@orrery/core/pillars'
import type { SajuResult } from '@orrery/core/types'
import { elementOf, ko } from '../analysis.ts'

const LABELS = ['시주', '일주', '월주', '년주']

function Char({ char, sipsin }: { char: string; sipsin: string }) {
  const element = elementOf(char)
  return (
    <div className={`char ${element ?? 'unknown'}`}>
      <span className="sipsin">{sipsin}</span>
      <span className="hanja">{char === '?' ? '?' : char}</span>
      <span className="reading">{char === '?' ? '' : toHangul(char)}</span>
    </div>
  )
}

/** 신살 목록 (길신 → 흉신) */
function salList(result: SajuResult): string[] {
  const s = result.specialSals
  const at = (idx: number[]) => idx.map(i => LABELS[i].slice(0, 1)).join('·')
  const out: string[] = []
  const add = (name: string, idx: number[]) => { if (idx.length) out.push(`${name}(${at(idx)})`) }
  add('천을귀인', s.cheonul)
  add('천덕귀인', s.cheonduk)
  add('월덕귀인', s.wolduk)
  add('문창귀인', s.munchang)
  add('금여록', s.geumyeo)
  add('양인살', s.yangin)
  add('도화살', s.dohwa)
  if (s.baekho) out.push('백호살')
  if (s.goegang) out.push('괴강살')
  if (s.hongyeom) out.push('홍염살')
  return out
}

export function PillarChart({ result }: { result: SajuResult }) {
  const sals = salList(result)
  const gongmang = result.gongmang.branches.filter(Boolean)

  return (
    <section className="card">
      <h2>사주 원국</h2>
      <div className="pillars">
        {result.pillars.map((p, i) => (
          <div key={i} className={`pillar ${i === 1 ? 'day' : ''}`}>
            <div className="pillar-label">{LABELS[i]}</div>
            <Char char={p.pillar.stem} sipsin={ko(p.stemSipsin)} />
            <Char char={p.pillar.branch} sipsin={ko(p.branchSipsin)} />
            <div className="meta">
              <span>{p.pillar.ganzi.includes('?') ? '-' : ko(p.unseong)}</span>
              <span className="hidden-stems">{p.jigang.replace(/ /g, '')}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="tags">
        {sals.map(s => <span key={s} className="tag">{s}</span>)}
        {gongmang.length > 0 && <span className="tag muted">공망 {gongmang.join('')}</span>}
      </div>
    </section>
  )
}

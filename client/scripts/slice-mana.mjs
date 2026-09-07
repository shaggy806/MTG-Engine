// Slice scripts/mana-spritesheet.svg (a 10-column x 7-row grid of every WotC
// mana / tap symbol) into one <token>.svg per pip under public/mana/.
//
//   node client/scripts/slice-mana.mjs
//
// Each source element (circle / path / polygon) is assigned to the grid cell
// its bounding-box centre falls in, then the cell's elements are re-emitted
// with a translate so the pip sits in a clean `viewBox="0 0 100 100"`.
// Re-run this if mana-spritesheet.svg is ever replaced. The token -> filename
// map (NAMES) below is the source of truth the client's mana.ts mirrors.
// `C.svg` (colorless) is hand-authored — the sheet has none — and KEEP-listed
// so a regen doesn't delete it.

import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, 'mana-spritesheet.svg')
const OUT = join(HERE, '..', 'public', 'mana')

const COLS = [-895, -790, -685, -580, -475, -370, -265, -160, -55, 50]
const ROWS = [-160, -55, 50, 155, 260, 365, 470]

// Grid cell -> emitted filename (without .svg). Row 6 (mega-symbols like
// {1000000}) and the blank cells are intentionally left out.
const NAMES = {}
for (let i = 0; i < 10; i += 1) NAMES[`${i},0`] = String(i)
for (let i = 0; i < 10; i += 1) NAMES[`${i},1`] = String(10 + i)
NAMES['0,2'] = '20'
;['X', 'Y', 'Z'].forEach((n, i) => (NAMES[`${i + 1},2`] = n))
;[...'WUBRGS'].forEach((c, i) => (NAMES[`${i + 4},2`] = c))
;['WU', 'WB', 'UB', 'UR', 'BR', 'BG', 'RW', 'RG', 'GW', 'GU'].forEach(
  (h, i) => (NAMES[`${i},3`] = h),
)
;[...'WUBRG'].forEach((c, i) => (NAMES[`${i},4`] = `2${c}`))
;[...'WUBRG'].forEach((c, i) => (NAMES[`${i + 5},4`] = `${c}P`))
Object.assign(NAMES, {
  '0,5': 'Q',
  '1,5': 'T',
  '2,5': 'INFINITY',
  '3,5': 'HALF',
  '4,5': 'TAP_ALT',
  '5,5': 'TAP_SQUARE',
  '6,5': 'CHAOS',
})

const NUM = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g
const nums = (t) => (t.match(NUM) ?? []).map(Number)

/** Bounding box of a path `d` string (walks abs/rel commands, control points included). */
function pathBBox(d) {
  const xs = []
  const ys = []
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  for (const [, cmd, argStr] of d.matchAll(/([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g)) {
    const a = nums(argStr)
    const rel = cmd === cmd.toLowerCase()
    const c = cmd.toUpperCase()
    let i = 0
    const put = (px, py) => {
      xs.push(px)
      ys.push(py)
    }
    if (c === 'M' || c === 'L' || c === 'T') {
      let first = c === 'M'
      while (i + 1 <= a.length - 1) {
        x = rel ? x + a[i] : a[i]
        y = rel ? y + a[i + 1] : a[i + 1]
        put(x, y)
        if (first) {
          sx = x
          sy = y
          first = false
        }
        i += 2
      }
    } else if (c === 'H') {
      for (const n of a) {
        x = rel ? x + n : n
        put(x, y)
      }
    } else if (c === 'V') {
      for (const n of a) {
        y = rel ? y + n : n
        put(x, y)
      }
    } else if (c === 'C' || c === 'S' || c === 'Q') {
      const step = c === 'C' ? 6 : 4
      while (i + step - 1 <= a.length - 1) {
        const p = a.slice(i, i + step)
        for (let j = 0; j < step; j += 2) put(rel ? x + p[j] : p[j], rel ? y + p[j + 1] : p[j + 1])
        x = rel ? x + p[step - 2] : p[step - 2]
        y = rel ? y + p[step - 1] : p[step - 1]
        i += step
      }
    } else if (c === 'A') {
      while (i + 6 <= a.length - 1) {
        const p = a.slice(i, i + 7)
        x = rel ? x + p[5] : p[5]
        y = rel ? y + p[6] : p[6]
        put(x, y)
        i += 7
      }
    } else if (c === 'Z') {
      x = sx
      y = sy
    }
  }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

function elemBBox(tag, frag) {
  const attr = (k) => {
    const m = frag.match(new RegExp(`${k}="([^"]+)"`))
    return m ? Number(m[1]) : 0
  }
  if (tag === 'circle') {
    const [cx, cy, r] = [attr('cx'), attr('cy'), attr('r')]
    return [cx - r, cy - r, cx + r, cy + r]
  }
  if (tag === 'ellipse') {
    const [cx, cy, rx, ry] = [attr('cx'), attr('cy'), attr('rx'), attr('ry')]
    return [cx - rx, cy - ry, cx + rx, cy + ry]
  }
  if (tag === 'polygon' || tag === 'line') {
    const pts = nums(tag === 'polygon' ? frag.match(/points="([^"]+)"/)[1] : frag)
    const px = pts.filter((_, i) => i % 2 === 0)
    const py = pts.filter((_, i) => i % 2 === 1)
    return [Math.min(...px), Math.min(...py), Math.max(...px), Math.max(...py)]
  }
  return pathBBox(frag.match(/d="([^"]+)"/s)[1])
}

const nearest = (arr, v) =>
  arr.reduce((best, _, k) => (Math.abs(arr[k] - v) < Math.abs(arr[best] - v) ? k : best), 0)

// Source is a CRLF Illustrator export with newline-wrapped `d=""` attributes;
// normalise to LF and collapse the intra-attribute whitespace so the emitted
// pips are tidy single-ending files.
const src = readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n')
const cells = new Map()
for (const m of src.matchAll(/<(circle|path|polygon|line|ellipse)\b[^>]*?\/?>/gs)) {
  const [frag, tag] = m
  const [x0, y0, x1, y1] = elemBBox(tag, frag)
  const col = nearest(COLS, (x0 + x1) / 2)
  const row = nearest(ROWS, (y0 + y1) / 2)
  const name = NAMES[`${col},${row}`]
  if (!name) continue
  const frags = (cells.get(name) ?? cells.set(name, { col, row, frags: [] }).get(name)).frags
  frags.push(frag.trim().replace(/\s+/g, ' '))
}

// Hand-authored pips the spritesheet doesn't provide — never regenerated here.
const KEEP = new Set(['C.svg'])

mkdirSync(OUT, { recursive: true })
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.svg') && !KEEP.has(f)) unlinkSync(join(OUT, f))
}
for (const [name, { col, row, frags }] of cells) {
  const dx = -(COLS[col] - 50)
  const dy = -(ROWS[row] - 50)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n` +
    `  <g transform="translate(${dx} ${dy})">\n    ${frags.join('\n    ')}\n  </g>\n</svg>\n`
  writeFileSync(join(OUT, `${name}.svg`), svg)
}

console.log(`sliced ${cells.size} symbols into ${OUT}`)

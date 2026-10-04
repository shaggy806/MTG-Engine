/**
 * docs/manual-checks.md, read into its entries for the scenario builder's
 * "Manual checks" list — so what to do and what to look for is shown from
 * the doc itself, never a copy that drifts. A dev build only (the builder).
 */

import doc from '../../../docs/manual-checks.md?raw'

export interface ManualCheckEntry {
  /** The `###` heading. */
  readonly title: string
  /** The `##` section it's under. */
  readonly section: string
  /** Its paragraphs: the kind line, then one per bullet (Setup, Do, Check,
   * Known limits), with markdown emphasis left out. */
  readonly paragraphs: readonly string[]
}

const plain = (s: string): string => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`([^`]+)`/g, '$1')

function parse(text: string): ManualCheckEntry[] {
  const entries: ManualCheckEntry[] = []
  let section = ''
  let current: { title: string; section: string; paragraphs: string[] } | null = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd()
    if (line.startsWith('## ')) {
      section = line.slice(3).replace(/\s*\(2026[^)]*\)\s*$/, '').trim()
      current = null
      continue
    }
    if (line.startsWith('### ')) {
      current = { title: line.slice(4).trim(), section, paragraphs: [] }
      entries.push(current)
      continue
    }
    if (current === null || line.trim() === '') continue
    if (line.startsWith('- ') || current.paragraphs.length === 0) {
      current.paragraphs.push(plain(line.replace(/^- /, '')))
    } else {
      current.paragraphs[current.paragraphs.length - 1] += ` ${plain(line.trim())}`
    }
  }
  return entries
}

export const MANUAL_CHECK_ENTRIES: readonly ManualCheckEntry[] = parse(doc)

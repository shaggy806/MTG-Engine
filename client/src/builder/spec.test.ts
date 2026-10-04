import { describe, expect, it } from 'vitest'
import type { PlayerId } from 'engine/client'
import type { ScenarioSpec } from 'protocol'
import {
  addCards,
  duplicateCard,
  parseScenario,
  removeCard,
  setCounter,
  setSeatCount,
  updateCard,
} from './spec.ts'

const ALICE = 'alice' as PlayerId
const BOB = 'bob' as PlayerId

const empty: ScenarioSpec = {
  seats: [
    { player: ALICE, life: 40, bot: false },
    { player: BOB, life: 40, bot: true },
  ],
  cards: [],
  active: ALICE,
  step: 'precombat-main',
  libraryFill: 40,
}

describe('scenario edits', () => {
  it('adds copies with keys of their own, a library card on top', () => {
    let spec = addCards(empty, { name: 'Hill Giant', owner: ALICE, zone: 'library' })
    spec = addCards(spec, { name: 'Grizzly Bears', owner: ALICE, zone: 'library' }, 2)
    expect(spec.cards.map((c) => c.name)).toEqual(['Grizzly Bears', 'Grizzly Bears', 'Hill Giant'])
    expect(new Set(spec.cards.map((c) => c.key)).size).toBe(3)
    spec = addCards(spec, { name: 'Craw Wurm', owner: ALICE, zone: 'library' }, 1, true)
    expect(spec.cards.at(-1)?.name).toBe('Craw Wurm')
  })

  it('drops battlefield-only state, and attachments to it, when a card leaves the battlefield', () => {
    let spec = addCards(empty, { name: 'Grizzly Bears', owner: ALICE, zone: 'battlefield', tapped: true })
    const bears = spec.cards[0].key
    spec = addCards(spec, { name: 'Pacifism', owner: BOB, zone: 'battlefield', attachedTo: bears })
    spec = setCounter(spec, bears, '+1/+1', 2)
    expect(spec.cards[0].counters).toEqual({ '+1/+1': 2 })
    spec = updateCard(spec, bears, { zone: 'graveyard' })
    expect(spec.cards[0]).toEqual({ key: bears, name: 'Grizzly Bears', owner: ALICE, zone: 'graveyard' })
    expect(spec.cards[1].attachedTo).toBeUndefined()
  })

  it('removes a card with its attachments, and duplicates one unattached', () => {
    let spec = addCards(empty, { name: 'Grizzly Bears', owner: ALICE, zone: 'battlefield' })
    const bears = spec.cards[0].key
    spec = addCards(spec, { name: 'Pacifism', owner: BOB, zone: 'battlefield', attachedTo: bears })
    const aura = spec.cards[1].key
    const twice = duplicateCard(spec, aura)
    expect(twice.cards).toHaveLength(3)
    expect(twice.cards[2].attachedTo).toBeUndefined()
    spec = removeCard(spec, bears)
    expect(spec.cards).toEqual([{ key: aura, name: 'Pacifism', owner: BOB, zone: 'battlefield' }])
  })

  it('sizes the table, taking a removed seat’s cards and turn with it', () => {
    let spec = setSeatCount(empty, 3)
    expect(spec.seats.map((s) => s.player)).toEqual(['alice', 'bob', 'carol'])
    spec = addCards(spec, { name: 'Hill Giant', owner: 'carol' as PlayerId, zone: 'hand' })
    spec = { ...spec, active: 'carol' as PlayerId }
    spec = setSeatCount(spec, 2)
    expect(spec.cards).toEqual([])
    expect(spec.active).toBe(ALICE)
  })

  it('reads a pasted scenario, refusing what isn’t one', () => {
    expect(parseScenario(JSON.stringify(empty))).toEqual(empty)
    expect(() => parseScenario('{"cards": []}')).toThrow(/seats/)
    expect(() => parseScenario('nope')).toThrow()
  })
})

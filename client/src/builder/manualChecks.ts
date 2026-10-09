/**
 * A scenario for each entry of `docs/manual-checks.md`, loadable from the
 * scenario builder's "Manual checks" list: the board its Setup describes,
 * one preset per board where an entry has several. The entry's own text
 * (what to do, what to look for) is read from the doc itself, by `title` —
 * which must match the entry's `###` heading exactly; a server test builds
 * every preset and checks each heading has one (`server/src/test/
 * manual-check-presets.test.ts`).
 *
 * Boards are written with `board()`: "you" are alice, at your own precombat
 * main unless said otherwise, and opponents are bots unless an entry needs
 * you to act for them (`human: true` — then "Sit" at their seat).
 */

import type { PlayerId } from 'engine/client'
import type { ScenarioCard, ScenarioSeat, ScenarioSpec, ScenarioStep } from 'protocol'

/** A card on a side: `"Mountain*3"` is three; an object for anything more. */
type Card =
  | string
  | {
      readonly name: string
      readonly n?: number
      readonly tapped?: boolean
      readonly sick?: boolean
      readonly counters?: Readonly<Record<string, number>>
      /** The name of a permanent on any side to attach to (the first found). */
      readonly attach?: string
      readonly commander?: boolean
    }

interface Side {
  readonly bf?: readonly Card[]
  readonly hand?: readonly Card[]
  readonly gy?: readonly Card[]
  readonly exile?: readonly Card[]
  /** Top first. */
  readonly lib?: readonly Card[]
  /** Commanders left in the command zone. */
  readonly cmd?: readonly string[]
  readonly life?: number
  readonly poison?: number
  /** Played by you ("Sit" at the seat), not a bot. */
  readonly human?: boolean
}

interface BoardOpts {
  readonly you: Side
  /** One opponent, or several (a 3-4 player table). */
  readonly opp?: Side | readonly Side[]
  /** Whose turn: "you", or an opponent's index (0 = bob). */
  readonly turn?: 'you' | number
  readonly step?: ScenarioStep
  readonly fill?: number
}

export interface ManualCheckPreset {
  /** The entry's `###` heading in docs/manual-checks.md. */
  readonly title: string
  /** Which board, for an entry with several. */
  readonly variant?: string
  readonly spec: ScenarioSpec
}

const PLAYERS = ['alice', 'bob', 'carol', 'dave'] as unknown as readonly PlayerId[]

function expand(card: Card): Exclude<Card, string>[] {
  if (typeof card !== 'string') return Array.from({ length: card.n ?? 1 }, () => card)
  const m = /^(.*)\*(\d+)$/.exec(card)
  const name = m ? m[1] : card
  const n = m ? Number(m[2]) : 1
  return Array.from({ length: n }, () => ({ name }))
}

export function board(opts: BoardOpts): ScenarioSpec {
  const opps = opts.opp === undefined ? [{}] : Array.isArray(opts.opp) ? (opts.opp as readonly Side[]) : [opts.opp as Side]
  const sides: readonly Side[] = [opts.you, ...opps]
  const cards: ScenarioCard[] = []
  const pendingAttach: { key: string; to: string }[] = []
  let next = 1
  sides.forEach((side, i) => {
    const owner = PLAYERS[i]
    const put = (list: readonly Card[] | undefined, zone: ScenarioCard['zone']) => {
      for (const card of (list ?? []).flatMap(expand)) {
        const key = `m${next++}`
        cards.push({
          key,
          name: card.name,
          owner,
          zone,
          ...(card.commander ? { commander: true } : {}),
          ...(zone === 'battlefield' && card.tapped ? { tapped: true } : {}),
          ...(zone === 'battlefield' && card.sick ? { sick: true } : {}),
          ...(zone === 'battlefield' && card.counters ? { counters: card.counters } : {}),
        })
        if (zone === 'battlefield' && card.attach !== undefined) pendingAttach.push({ key, to: card.attach })
      }
    }
    put(side.bf, 'battlefield')
    put(side.hand, 'hand')
    put(side.gy, 'graveyard')
    put(side.exile, 'exile')
    put(side.lib, 'library')
    put(
      (side.cmd ?? []).map((name) => ({ name, commander: true })),
      'command',
    )
  })
  const withAttach = cards.map((c) => {
    const want = pendingAttach.find((p) => p.key === c.key)
    if (want === undefined) return c
    const host = cards.find((h) => h.zone === 'battlefield' && h.name === want.to && h.key !== c.key)
    if (host === undefined) throw new Error(`nothing named ${want.to} to attach ${c.name} to`)
    return { ...c, attachedTo: host.key }
  })
  const seats: ScenarioSeat[] = sides.map((side, i) => ({
    player: PLAYERS[i],
    life: side.life ?? 40,
    bot: i > 0 && side.human !== true,
    ...(side.poison !== undefined ? { poison: side.poison } : {}),
  }))
  return {
    seats,
    cards: withAttach,
    active: opts.turn === undefined || opts.turn === 'you' ? PLAYERS[0] : PLAYERS[opts.turn + 1],
    step: opts.step ?? 'precombat-main',
    libraryFill: opts.fill ?? 40,
  }
}

const preset = (title: string, spec: ScenarioSpec, variant?: string): ManualCheckPreset => ({
  title,
  spec,
  ...(variant !== undefined ? { variant } : {}),
})

export const MANUAL_CHECK_PRESETS: readonly ManualCheckPreset[] = [
  // --- Spells, copies and mana from unusual places -------------------------
  preset(
    'Feather, the Redeemed',
    board({
      you: {
        bf: ['Feather, the Redeemed', 'Grizzly Bears', 'Mountain*4', 'Forest*4', 'Island*4', 'Plains*4', 'Swamp*2'],
        hand: ['Giant Growth', 'Counterspell', 'Unsummon', 'Murderous Rider'],
        gy: ['Defy Gravity'],
      },
    }),
    '(a)-(c), (e), (f)',
  ),
  preset(
    'Feather, the Redeemed',
    board({
      you: {
        bf: ['Feather, the Redeemed', 'Grizzly Bears', 'Mountain*4', 'Forest*4', 'Island*4', 'Plains*4', 'Swamp*2'],
        hand: ['Giant Growth', 'Counterspell', 'Unsummon', 'Murderous Rider'],
        gy: ['Defy Gravity'],
      },
      opp: { bf: ['Rest in Peace'] },
    }),
    '(d) Rest in Peace',
  ),
  preset(
    'Zada, Hedron Grinder',
    board({
      you: {
        bf: ['Zada, Hedron Grinder', 'Grizzly Bears*2', 'Argothian Enchantress', 'Forest*5', 'Plains*4', 'Mountain*2', 'Island*2'],
        hand: ['Giant Growth*2', 'Seeds of Strength*2', 'Raise the Alarm', 'Counterspell'],
      },
      opp: { bf: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Ivy, Gleeful Spellthief',
    board({
      you: {
        bf: ['Ivy, Gleeful Spellthief', 'Grizzly Bears*2', 'Lightning Greaves', 'Forest*3', 'Plains*3', 'Island*2'],
        hand: ['Seeds of Strength*2'],
      },
      opp: {
        human: true,
        bf: ['Grizzly Bears', 'Forest*2', 'Mountain*2', 'Plains*2'],
        hand: ['Giant Growth', 'Shock', 'Swords to Plowshares'],
      },
      turn: 0,
    }),
    "starts on the opponent's turn: Sit at Bob to cast",
  ),
  preset(
    'Krark, the Thumbless',
    board({
      you: {
        bf: ['Krark, the Thumbless', 'Mountain*6', 'Island*3'],
        hand: ['Shock*3', 'Lightning Bolt*2', 'Counterspell'],
      },
      opp: { bf: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Rebuff the Wicked, Dawn Charm, Season of Growth',
    board({
      you: {
        bf: ['Season of Growth', 'Grizzly Bears*2', 'Plains*5', 'Forest*4'],
        hand: ['Rebuff the Wicked', 'Dawn Charm', 'Cloudshift', 'Giant Growth', 'Seeds of Strength', 'Raise the Alarm'],
      },
      opp: { human: true, bf: ['Grizzly Bears', 'Mountain*3'], hand: ['Shock*3'] },
      turn: 0,
    }),
    "starts on the opponent's turn: Sit at Bob to Shock",
  ),
  preset(
    "Sevinne's Reclamation",
    board({
      you: {
        bf: ['Plains*4', 'Forest*2', 'Island'],
        hand: ["Sevinne's Reclamation"],
        gy: ["Sevinne's Reclamation", 'Wall of Omens', 'Elvish Visionary', 'Llanowar Elves'],
      },
    }),
  ),
  preset(
    "Glarb, Calamity's Augur",
    board({
      you: {
        bf: ["Glarb, Calamity's Augur", 'Forest*2', 'Swamp*2', 'Island*2', 'Wastes'],
        lib: ['Stonecoil Serpent', 'Colossal Dreadmaw', 'Forest', 'Grizzly Bears'],
      },
    }),
  ),
  ...(
    [
      ['Thundermane Dragon', { bf: ['Thundermane Dragon', 'Mountain*4', 'Forest*4', 'Island'], hand: ['Unsummon'], lib: ['Craw Wurm', 'Grizzly Bears'] }],
      ['Korlessa', { bf: ['Korlessa, Scale Singer', 'Island*3', 'Forest*3', 'Mountain*4'], lib: ['Shivan Dragon', 'Grizzly Bears'] }],
      ['Sigarda', { bf: ['Sigarda, Font of Blessings', 'Grizzly Bears', 'Plains*4', 'Forest*3'], lib: ['Akroan Jailer'] }],
      ['Realmwalker', { bf: ['Forest*4', 'Island*2'], hand: ['Realmwalker'], lib: ['Grizzly Bears', 'Llanowar Elves'] }],
      ['Emperor Mihail II', { bf: ['Emperor Mihail II', 'Island*5'], lib: ['Coral Merfolk'] }],
      ['Hakoda', { bf: ['Hakoda, Selfless Commander', 'Grizzly Bears', 'Plains*3', 'Island*3'], lib: ['Expedition Envoy'] }],
      ['Elven Chorus', { bf: ['Elven Chorus', 'Grizzly Bears', 'Llanowar Elves', 'Forest*4'], lib: ['Grizzly Bears'] }],
      ['Crystal Skull, Isu Spyglass', { bf: ['Crystal Skull, Isu Spyglass', 'Island*3', 'Mountain*3'], lib: ['Sol Ring', 'Krenko, Mob Boss'] }],
      ['Mystic Forge', { bf: ['Mystic Forge', 'Mountain*4'], lib: ['Sol Ring', 'Wastes', 'Grizzly Bears'] }],
    ] as const
  ).map(([variant, you]) =>
    preset(
      'Thundermane Dragon, Korlessa, Scale Singer, Sigarda, Font of Blessings, Realmwalker, Emperor Mihail II, Hakoda, Selfless Commander, Elven Chorus, Crystal Skull, Isu Spyglass, Mystic Forge',
      board({
        you,
        ...(variant === 'Sigarda' ? { opp: { bf: ['Plains*2'], hand: ['Swords to Plowshares'], human: true } } : {}),
      }),
      variant,
    ),
  ),
  preset(
    'Gonti, Canny Acquisitor, Outrageous Robbery',
    board({
      you: { bf: ['Gonti, Canny Acquisitor', 'Grizzly Bears', 'Island*5'] },
      opp: { lib: ['Craw Wurm', 'Forest'] },
    }),
    'Gonti',
  ),
  preset(
    'Gonti, Canny Acquisitor, Outrageous Robbery',
    board({
      you: { bf: ['Swamp*4'], hand: ['Outrageous Robbery'] },
      opp: { lib: ['Grizzly Bears', 'Forest'] },
      turn: 0,
      step: 'end',
    }),
    "Robbery, at the opponent's end step",
  ),
  preset(
    'Grenzo, Havoc Raiser, Stolen Strategy, Laughing Jasper Flint',
    board({
      you: { bf: ['Grenzo, Havoc Raiser', 'Grizzly Bears', 'Mountain*2'] },
      opp: { bf: ['Craw Wurm'], lib: ['Grizzly Bears', 'Forest'] },
    }),
    'Grenzo',
  ),
  preset(
    'Grenzo, Havoc Raiser, Stolen Strategy, Laughing Jasper Flint',
    board({
      you: {
        bf: ['Stolen Strategy', 'Laughing Jasper Flint', 'Grizzly Bears', 'Island*5'],
        hand: ['Act of Treason'],
      },
      opp: { bf: ['Craw Wurm'], lib: ['Grizzly Bears', 'Forest', 'Lightning Bolt'] },
      turn: 0,
      step: 'end',
    }),
    "upkeep pair, from the opponent's end step",
  ),
  preset(
    'You Find Some Prisoners',
    board({
      you: { bf: ['Mountain*4'], hand: ['You Find Some Prisoners'] },
      opp: { bf: ['Sol Ring'], lib: ['Island', 'Grizzly Bears', 'Lightning Bolt'] },
    }),
  ),
  preset(
    'Tinybones, Bauble Burglar',
    board({
      you: { bf: ['Tinybones, Bauble Burglar', 'Swamp*6'], hand: ['Mind Rot'] },
      opp: { human: true, hand: ['Grizzly Bears', 'Lightning Bolt', 'Craw Wurm'] },
    }),
  ),
  preset(
    'Kalamax, the Stormsire, Stella Lee, Wild Card',
    board({
      you: {
        bf: [{ name: 'Kalamax, the Stormsire', tapped: true }, 'Stella Lee, Wild Card', 'Mountain*8', 'Island*3', 'Forest*2'],
        hand: ['Shock*4'],
        lib: ['Grizzly Bears'],
      },
      opp: { life: 20 },
    }),
  ),
  preset(
    'Fire Lord Azula, Alania, Divergent Storm',
    board({
      you: { bf: ['Fire Lord Azula', 'Mountain*6', 'Swamp*2'], hand: ['Lightning Bolt*3'] },
      opp: { bf: ['Grizzly Bears', 'Craw Wurm'] },
    }),
    'Azula',
  ),
  preset(
    'Fire Lord Azula, Alania, Divergent Storm',
    board({
      you: {
        bf: ['Island*5', 'Mountain*6'],
        hand: ['Alania, Divergent Storm', 'Shock*2', 'Divination', 'Kindlespark Duo*2'],
      },
      opp: [{}, {}],
    }),
    'Alania, three players',
  ),
  preset(
    'Imodane, the Pyrohammer',
    board({
      you: { bf: ['Imodane, the Pyrohammer', 'Grizzly Bears', 'Mountain*8'], hand: ['Lightning Bolt*2', 'Fireball', 'Shock'] },
      opp: [{ bf: ['Grizzly Bears'] }, { bf: ['Grizzly Bears'] }],
    }),
  ),
  preset(
    'Reflections of Littjara, Volo, Guide to Monsters',
    board({
      you: {
        bf: ['Island*4', 'Forest*4', 'Mountain'],
        hand: ['Reflections of Littjara', 'Grizzly Bears*2', 'Changeling Outcast', 'Shock'],
      },
    }),
    'Reflections',
  ),
  preset(
    'Reflections of Littjara, Volo, Guide to Monsters',
    board({
      you: { bf: ['Volo, Guide to Monsters', 'Island*3', 'Forest*4'], hand: ['Grizzly Bears*2', 'Craw Wurm'], gy: [] },
    }),
    'Volo',
  ),
  preset(
    'Vizier of the Menagerie, Chromatic Orrery',
    board({
      you: { bf: ['Vizier of the Menagerie', 'Mountain*3'], hand: ['Grizzly Bears', 'Glaring Fleshraker', 'Divination'] },
    }),
    'A: Vizier, Mountains',
  ),
  preset(
    'Vizier of the Menagerie, Chromatic Orrery',
    board({
      you: { bf: ['Vizier of the Menagerie', 'Forest*3'], hand: ['Murderous Rider'] },
      opp: { bf: ['Grizzly Bears'] },
    }),
    'B: Vizier, Murderous Rider',
  ),
  preset(
    'Vizier of the Menagerie, Chromatic Orrery',
    board({
      you: {
        bf: [{ name: 'Chromatic Orrery', tapped: true }, 'Mountain*3'],
        hand: ['Divination', 'Painful Truths', 'Glaring Fleshraker', 'Wastes'],
      },
    }),
    'C: Chromatic Orrery',
  ),
  preset(
    'Grolnok, the Omnivore',
    board({
      you: {
        bf: ['Grolnok, the Omnivore', 'Forest*3', 'Island*2'],
        hand: ['Thought Scour', 'Unsummon'],
        lib: ['Forest', 'Grizzly Bears', 'Lightning Bolt'],
      },
    }),
  ),
  preset(
    'Haldan, Avid Arcanist, Pako, Arcane Retriever',
    board({
      you: { bf: ['Haldan, Avid Arcanist', 'Pako, Arcane Retriever', 'Mountain*3'], lib: ['Forest'] },
      opp: { lib: ['Divination'] },
    }),
    'Divination on top',
  ),
  preset(
    'Haldan, Avid Arcanist, Pako, Arcane Retriever',
    board({
      you: { bf: ['Haldan, Avid Arcanist', 'Pako, Arcane Retriever', 'Mountain*3'], lib: ['Forest'] },
      opp: { lib: ['Murderous Rider'] },
    }),
    'Murderous Rider on top',
  ),
  preset(
    'Haldan, Avid Arcanist, Pako, Arcane Retriever',
    board({
      you: { bf: ['Haldan, Avid Arcanist', 'Pako, Arcane Retriever', 'Mountain*3'], lib: ['Forest'] },
      opp: { lib: ['Grizzly Bears'] },
    }),
    'Grizzly Bears on top',
  ),

  // --- Toxic, casualty, extra upkeeps and copy-on-enter ---------------------
  preset(
    'Cut Your Losses',
    board({ you: { bf: ['Island*6', 'Grizzly Bears', 'Memnite'], hand: ['Cut Your Losses'] } }),
    'Bears and Memnite (the opponent has 40 in library)',
  ),
  preset('Cut Your Losses', board({ you: { bf: ['Island*6', 'Memnite'], hand: ['Cut Your Losses'] } }), 'Memnite only'),
  preset(
    'Silverquill, the Disputant, Anhelo, the Painter',
    board({
      you: {
        bf: ['Silverquill, the Disputant', 'Anhelo, the Painter', 'Young Pyromancer*2', 'Grizzly Bears', 'Mountain*4'],
        hand: ['Lightning Bolt*3'],
      },
      opp: { bf: ['Serra Angel', 'Mountain'], life: 20 },
    }),
  ),
  preset(
    'Venerated Rotpriest',
    board({
      you: { bf: ['Venerated Rotpriest', 'Grizzly Bears', 'Swiftfoot Boots', 'Forest*2'], hand: ['Giant Growth'] },
      opp: [{ human: true, bf: ['Mountain'], hand: ['Lightning Bolt'] }, {}],
    }),
  ),
  preset(
    'Mockingbird, Deceptive Frostkite, Malleable Impostor, Glasspool Mimic // Glasspool Shore, Stunt Double',
    board({
      you: {
        bf: ['Island*10', 'Forest', 'Llanowar Elves', 'Grizzly Bears', 'Serra Angel', 'Mulldrifter'],
        hand: ['Mockingbird', 'Deceptive Frostkite', 'Malleable Impostor', 'Glasspool Mimic', 'Stunt Double', 'Giant Growth'],
      },
      opp: { bf: ['Grizzly Bears', 'Wall of Denial'] },
    }),
  ),
  preset(
    'Phyrexian Metamorph, Clever Impersonator, Sculpting Steel, Copy Artifact, Masterwork of Ingenuity, Vesuva',
    board({
      you: {
        bf: ['Island*10', 'Sol Ring', 'Grizzly Bears', { name: 'Swiftfoot Boots', attach: 'Grizzly Bears' }, 'Phyrexian Arena', 'Forest'],
        hand: ['Phyrexian Metamorph', 'Clever Impersonator', 'Sculpting Steel', 'Copy Artifact', 'Masterwork of Ingenuity', 'Vesuva'],
      },
      opp: { bf: [{ name: 'Nissa, Who Shakes the World', counters: { loyalty: 2 } }, 'Mountain', 'Craw Wurm'] },
    }),
  ),
  preset(
    'Copy Enchantment, Mirrormade',
    board({
      you: { bf: ['Sol Ring', 'Island*5', { name: 'Pacifism', attach: 'Grizzly Bears' }], hand: ['Copy Enchantment', 'Mirrormade'] },
      opp: { bf: ['Grizzly Bears', 'Slippery Bogle'] },
    }),
  ),
  preset(
    "Estrid's Invocation, Altered Ego",
    board({
      you: { bf: ['Phyrexian Arena', 'Island*4', 'Forest*4'], hand: ["Estrid's Invocation", 'Altered Ego'] },
      opp: { human: true, bf: ['Island*2', 'Grizzly Bears'], hand: ['Counterspell'] },
    }),
  ),
  preset(
    'Ghalta and Mavren, Auton Soldier',
    board({
      you: { bf: ['Ghalta and Mavren', 'Serra Angel', 'Grizzly Bears', 'Plains*2'], hand: ['Swords to Plowshares'] },
      opp: [{}, {}],
    }),
    'Ghalta and Mavren, three players',
  ),
  preset(
    'Ghalta and Mavren, Auton Soldier',
    board({ you: { bf: ['Krenko, Mob Boss', 'Island*6'], hand: ['Auton Soldier'] }, opp: [{}, {}] }),
    'Auton Soldier, three players',
  ),
  preset(
    'Karumonix, the Rat King, Blightbelly Rat, Bilious Skulldweller',
    board({
      you: {
        bf: ['Swamp*3', 'Blightbelly Rat', 'Bilious Skulldweller'],
        hand: ['Karumonix, the Rat King'],
        lib: ['Island', 'Blightbelly Rat', 'Bilious Skulldweller', 'Island', 'Blightbelly Rat'],
      },
      opp: { human: true, bf: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Bloated Contaminator, Contaminant Grafter, Tyrranax Rex',
    board({
      you: { bf: ['Bloated Contaminator', 'Contaminant Grafter'], hand: ['Forest'] },
      opp: { human: true, poison: 1, bf: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Bloodroot Apothecary',
    board({
      you: { bf: ['Forest*3'], hand: ['Bloodroot Apothecary'] },
      opp: [{ human: true, bf: ['Forest*2', 'Soldier Token', 'Viscera Seer'], hand: ['Grizzly Bears'] }, {}],
    }),
  ),
  preset(
    "White Sun's Twilight, Mirrex, Phyrexian Mite token",
    board({
      you: { bf: ['Plains*7', 'Phyrexian Mite Token', 'Grizzly Bears'], hand: ['Mirrex', "White Sun's Twilight"] },
      opp: { bf: ['Serra Angel'] },
    }),
  ),
  preset(
    'Obeka, Splitter of Seconds',
    board({
      you: { bf: ['Obeka, Splitter of Seconds', 'Phyrexian Arena', 'Mountain*2', 'Forest'], hand: ['Rift Bolt', 'Giant Growth'] },
      opp: { bf: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Sakashima of a Thousand Faces, Spark Double, Clone (for comparison)',
    board({
      you: {
        bf: ['Island*10', 'Mountain', 'Krenko, Mob Boss', 'Nissa, Who Shakes the World'],
        hand: ['Spark Double*2', 'Clone', 'Sakashima of a Thousand Faces', 'Lightning Bolt'],
      },
      opp: { bf: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Sakashima the Impostor',
    board({ you: { bf: ['Island*12', 'Grizzly Bears', 'Serra Angel'], hand: ['Sakashima the Impostor*2'] } }),
  ),
  preset(
    'Phantasmal Image, Clone (for comparison)',
    board({
      you: { bf: ['Serra Angel', 'Swiftfoot Boots', 'Island*6', 'Forest'], hand: ['Phantasmal Image', 'Clone', 'Giant Growth'] },
      opp: { human: true, bf: ['Mountain'], hand: ['Lightning Bolt'] },
    }),
  ),
  preset(
    'Cursed Mirror',
    board({ you: { bf: ['Mountain*3', 'Island*4'], hand: ['Cursed Mirror', 'Clone'] }, opp: { bf: ['Serra Angel'] } }),
  ),
  preset(
    'Aeve, Progenitor Ooze',
    board({ you: { bf: ['Forest*5', 'Mountain*2', 'Island*4'], hand: ['Lightning Bolt*2', 'Aeve, Progenitor Ooze', 'Clone'] } }),
  ),
  preset(
    'Prime Speaker Zegana, Tangleweave Armor',
    board({
      you: { bf: ['Grizzly Bears', 'Forest*3', 'Island*3', 'Mountain'], hand: ['Prime Speaker Zegana', 'Lightning Bolt'] },
      opp: { bf: ['Serra Angel'] },
    }),
    'Zegana',
  ),
  preset(
    'Prime Speaker Zegana, Tangleweave Armor',
    board({ you: { cmd: ['Krenko, Mob Boss'], bf: ['Forest*8', 'Grizzly Bears'], hand: ['Tangleweave Armor'] } }),
    'Tangleweave Armor, Krenko in the command zone',
  ),

  // --- Sacrifice costs and the Tarkir precons' one-offs ---------------------
  preset(
    'Sai, Master Thopterist, Ornithopter, Treasure Token',
    board({ you: { bf: ['Sai, Master Thopterist', 'Island*2', 'Sol Ring', 'Treasure Token*3'], hand: ['Ornithopter'] } }),
    'three Treasures',
  ),
  preset(
    'Sai, Master Thopterist, Ornithopter, Treasure Token',
    board({ you: { bf: ['Sai, Master Thopterist', 'Island*2', 'Thopter Token*10'], hand: ['Ornithopter'] } }),
    'a stack of ten Thopters',
  ),
  preset(
    'Sai, Master Thopterist, Ornithopter, Treasure Token',
    board({ you: { bf: ['Sai, Master Thopterist', 'Island', 'Treasure Token*2'], hand: ['Ornithopter'] } }),
    'edge case: one Island, two Treasures',
  ),
  preset(
    'Jarad, Golgari Lich Lord, Metalwork Colossus, Overgrown Tomb',
    board({ you: { bf: ['Overgrown Tomb*2', 'Forest', 'Swamp*2'], gy: ['Jarad, Golgari Lich Lord'] } }),
    'Jarad from the graveyard',
  ),
  preset(
    'Jarad, Golgari Lich Lord, Metalwork Colossus, Overgrown Tomb',
    board({
      you: { bf: ['Jarad, Golgari Lich Lord', 'Hill Giant', 'Swamp*2', 'Forest*2'], hand: ['Giant Growth'], gy: ['Grizzly Bears', 'Hill Giant'] },
    }),
    "Jarad's drain",
  ),
  preset(
    'Jarad, Golgari Lich Lord, Metalwork Colossus, Overgrown Tomb',
    board({
      you: { bf: ['Sol Ring', 'Mind Stone', 'Ornithopter', 'Wastes*6'], hand: ['Metalwork Colossus'], gy: ['Metalwork Colossus'] },
    }),
    'Metalwork Colossus',
  ),
  preset(
    'Priest of Forgotten Gods',
    board({
      you: { bf: ['Priest of Forgotten Gods', 'Grizzly Bears', 'Hill Giant', 'Serra Angel', 'Swamp*2'] },
      opp: [{ bf: ['Grizzly Bears', 'Llanowar Elves'] }, { bf: ['Hill Giant', 'Memnite'] }, {}],
      turn: 0,
    }),
    "four players, on Bob's turn",
  ),
  preset(
    'Grim Hireling, Magda, Brazen Outlaw, Axgard Cavalry, Shivan Dragon',
    board({ you: { bf: ['Grim Hireling', 'Grizzly Bears', 'Swamp', 'Treasure Token*3'] }, opp: { bf: ['Hill Giant'] } }),
    'Grim Hireling',
  ),
  preset(
    'Grim Hireling, Magda, Brazen Outlaw, Axgard Cavalry, Shivan Dragon',
    board({ you: { bf: ['Grim Hireling', 'Treasure Token*3'] }, opp: { bf: ['Hill Giant'] } }),
    'Grim Hireling without a Swamp',
  ),
  preset(
    'Grim Hireling, Magda, Brazen Outlaw, Axgard Cavalry, Shivan Dragon',
    board({
      you: {
        bf: ['Magda, Brazen Outlaw', 'Axgard Cavalry', 'Treasure Token*4', 'Mountain*2'],
        lib: ['Grizzly Bears', 'Shivan Dragon', 'Sol Ring', 'Forest'],
      },
    }),
    'Magda',
  ),
  preset(
    'Ruthless Technomancer',
    board({
      you: {
        bf: ['Swamp*6', 'Hill Giant', 'Grizzly Bears', 'Forest'],
        hand: ['Giant Growth', 'Ruthless Technomancer'],
        gy: ['Grizzly Bears', 'Hill Giant', 'Ornithopter'],
      },
    }),
  ),
  preset(
    'Stormshriek Feral, Flush Out, Marang River Regent, Coil and Catch, Whirlwing Stormbrood, Dynamic Soar, Bloomvine Regent, Claim Territory, Twincast, Counterspell, Run Away Together',
    board({
      you: {
        bf: ['Grizzly Bears', 'Mountain*5', 'Island*6', 'Forest*5', 'Plains*2'],
        hand: ['Stormshriek Feral', 'Marang River Regent', 'Whirlwing Stormbrood', 'Bloomvine Regent', 'Twincast', 'Counterspell', 'Run Away Together', 'Lightning Bolt'],
        lib: ['Forest*2'],
      },
      opp: { bf: ['Hill Giant'] },
    }),
  ),
  preset(
    'Glorybringer, Combat Celebrant, Stormbreath Dragon',
    board({
      you: { bf: ['Glorybringer', 'Combat Celebrant', 'Grizzly Bears'] },
      opp: { bf: ['Grizzly Bears', 'Hill Giant', 'Stormbreath Dragon'] },
    }),
  ),
  preset(
    'Glorybringer, Combat Celebrant, Stormbreath Dragon',
    board({ you: { bf: ['Glorybringer', 'Combat Celebrant', 'Grizzly Bears'] }, opp: { bf: ['Stormbreath Dragon'] } }),
    'only a Dragon to hit',
  ),
  preset(
    'Skarrgan Hellkite',
    board({ you: { bf: ['Mountain*10'], hand: ['Skarrgan Hellkite'] }, opp: { bf: ['Grizzly Bears*2'] } }),
  ),
  preset(
    'Dragonlord Atarka, Inferno Titan',
    board({
      you: { bf: ['Inferno Titan', 'Grizzly Bears', 'Mountain*4', 'Forest*4'], hand: ['Dragonlord Atarka'] },
      opp: [{ bf: ['Grizzly Bears', 'Hill Giant', 'Nissa, Who Shakes the World'] }, { bf: ['Craw Wurm'] }],
    }),
  ),
  preset(
    'Kotis, Sibsig Champion, River Kelpie, Stormshriek Feral',
    board({
      you: {
        bf: ['Kotis, Sibsig Champion', 'River Kelpie', 'Forest*3', 'Swamp*2', 'Island*2', 'Mountain*2'],
        gy: ['Grizzly Bears', 'Hill Giant', 'Stormshriek Feral', 'Forest*4'],
      },
    }),
  ),
  preset(
    'Necromantic Selection, Reunion of the House',
    board({
      you: { bf: ['Swamp*7', 'Grizzly Bears'], hand: ['Necromantic Selection'] },
      opp: { bf: ['Serra Angel', 'Soldier Token'], gy: ['Hill Giant'] },
    }),
    'Necromantic Selection',
  ),
  preset(
    'Necromantic Selection, Reunion of the House',
    board({
      you: { bf: ['Plains*7'], hand: ['Reunion of the House'], gy: ['Serra Angel*2', 'Hill Giant', 'Grizzly Bears', 'Ornithopter'] },
    }),
    'Reunion of the House',
  ),
  preset(
    'Protector of the Wastes, Run Away Together',
    board({
      you: { bf: ['Plains*11', 'Island*2', 'Sol Ring', 'Grizzly Bears'], hand: ['Protector of the Wastes', 'Run Away Together'] },
      opp: [{ bf: ['Sol Ring*2', 'Hill Giant', 'Craw Wurm'] }, { bf: ['Phyrexian Arena', 'Memnite'] }],
    }),
    'three players',
  ),
  preset(
    'Protector of the Wastes, Run Away Together',
    board({
      you: { bf: ['Plains*11', 'Island*2', 'Sol Ring', 'Grizzly Bears'], hand: ['Protector of the Wastes', 'Run Away Together'] },
      opp: { bf: ['Sol Ring*2', 'Hill Giant', 'Craw Wurm'] },
    }),
    'two players',
  ),
  preset(
    'Eliminate the Competition, Young Pyromancer',
    board({
      you: { bf: ['Swamp*5', 'Grizzly Bears', 'Hill Giant', 'Young Pyromancer'], hand: ['Eliminate the Competition'] },
      opp: { bf: ['Grizzly Bears', 'Serra Angel'] },
    }),
  ),
  preset(
    'Dread Return, River Kelpie',
    board({
      you: {
        bf: ['River Kelpie', 'Grizzly Bears', 'Hill Giant', 'Llanowar Elves', 'Swamp*5'],
        gy: ['Dread Return', 'Serra Angel'],
      },
    }),
  ),
  preset(
    'Westvale Abbey, Ormendahl, Profane Prince, Bastion of Remembrance',
    board({
      you: { bf: ['Westvale Abbey', 'Wastes*5', 'Bastion of Remembrance', 'Human Cleric Token*5'] },
      opp: { life: 20 },
    }),
    'exactly five creatures',
  ),
  preset(
    'Westvale Abbey, Ormendahl, Profane Prince, Bastion of Remembrance',
    board({
      you: { bf: ['Westvale Abbey', 'Wastes*5', 'Bastion of Remembrance', 'Human Cleric Token*5', 'Grizzly Bears'] },
      opp: { life: 20 },
    }),
    'six creatures (the prompt)',
  ),
  preset(
    'Mondrak, Glory Dominus, Zopandrel, Hunger Dominus, Hydra Broodmaster',
    board({
      you: {
        bf: ['Mondrak, Glory Dominus', 'Zopandrel, Hunger Dominus', 'Hydra Broodmaster', 'Grizzly Bears', 'Sol Ring', 'Treasure Token', 'Plains*4', 'Forest*5'],
      },
      opp: { bf: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Whirlwing Stormbrood, Thundermane Dragon, Marang River Regent, Glorybringer, Grizzly Bears',
    board({
      you: {
        bf: ['Whirlwing Stormbrood', 'Thundermane Dragon', 'Mountain*6', 'Island*4', 'Forest*4', 'Plains*2'],
        hand: ['Glorybringer', 'Grizzly Bears', 'Whirlwing Stormbrood', 'Stormshriek Feral'],
        lib: ['Marang River Regent'],
      },
      turn: 0,
    }),
    "starts on the opponent's turn",
  ),
  preset(
    'Stormbreath Dragon, Giggling Skitterspike, Giant Growth',
    board({
      you: { bf: ['Stormbreath Dragon', 'Giggling Skitterspike', 'Mountain*8', 'Forest*4'], hand: ['Giant Growth'] },
      opp: [{ hand: ['Grizzly Bears*2'] }, { life: 5, bf: ['Hill Giant'], hand: ['Grizzly Bears*5'] }],
    }),
  ),
  preset(
    'Behind the Scenes, Sidar Kondo of Jamuraa',
    board({
      you: { bf: ['Behind the Scenes', { name: 'Sidar Kondo of Jamuraa', counters: { '+1/+1': 1 } }, 'Grizzly Bears'] },
      opp: { human: true, bf: ['Hill Giant', 'Serra Angel', 'Grizzly Bears', 'Llanowar Elves'] },
    }),
  ),
  preset(
    'Millikin',
    board({ you: { bf: ['Millikin', 'Mountain'], hand: ['Ornithopter', 'Memnite'], lib: ['Hill Giant'] } }),
  ),
  preset('Millikin', board({ you: { bf: ['Millikin', 'Mountain'], hand: ['Ornithopter'] }, fill: 0 }), 'empty library'),

  // --- Copying abilities, and winning and losing the game -------------------
  preset(
    'Lithoform Engine',
    board({
      you: {
        bf: ['Lithoform Engine', 'Prodigal Sorcerer', 'Island*4', 'Forest*3', 'Mountain'],
        hand: ['Elvish Visionary', 'Grizzly Bears'],
      },
      opp: { human: true, bf: ['Llanowar Elves', 'Prodigal Sorcerer'] },
    }),
  ),
  preset(
    "Illusionist's Bracers",
    board({
      you: {
        bf: ['Prodigal Sorcerer', { name: "Illusionist's Bracers", attach: 'Prodigal Sorcerer' }, 'Llanowar Elves', 'Sakura-Tribe Elder', 'Island*6', 'Forest*2'],
        hand: ['Sublime Epiphany'],
      },
      opp: { bf: ['Llanowar Elves'] },
    }),
  ),
  preset(
    'Inalla, Archmage Ritualist, Virtue of Knowledge, Electroduplicate',
    board({
      you: {
        cmd: ['Inalla, Archmage Ritualist'],
        bf: ['Island*5', 'Swamp*3', 'Mountain*4'],
        hand: ['Prodigal Sorcerer*2', 'Elvish Visionary', 'Electroduplicate'],
      },
    }),
    '(a), (b): Inalla in the command zone',
  ),
  preset(
    'Inalla, Archmage Ritualist, Virtue of Knowledge, Electroduplicate',
    board({
      you: {
        cmd: ['Inalla, Archmage Ritualist'],
        bf: ['Virtue of Knowledge', 'Island*6', 'Swamp*3', 'Mountain*4', 'Forest'],
        hand: ['Prodigal Sorcerer*2', 'Elvish Visionary'],
      },
    }),
    '(c): Virtue of Knowledge out',
  ),
  preset(
    'Inalla, Archmage Ritualist, Virtue of Knowledge, Electroduplicate',
    board({
      you: {
        bf: [
          { name: 'Inalla, Archmage Ritualist', commander: true },
          'Prodigal Sorcerer*3',
          { name: 'Prodigal Sorcerer', sick: true },
          'Island*4',
          'Swamp*2',
        ],
      },
    }),
    '(d): five Wizards, one summoning sick',
  ),
  preset(
    'Thousand-Year Storm, Brain Freeze',
    board({
      you: {
        bf: ['Thousand-Year Storm', 'Island*7', 'Mountain*7', 'Forest*2'],
        hand: ['Opt', 'Grizzly Bears', 'Shock*2', 'Lightning Bolt*2', 'Brain Freeze'],
      },
      opp: { bf: ['Grizzly Bears', 'Llanowar Elves', 'Island*2'], hand: ['Counterspell'] },
    }),
  ),
  preset(
    'Chain of Vapor',
    board({
      you: { bf: ['Island*3', 'Mountain*3', 'Grizzly Bears'], hand: ['Chain of Vapor', 'Act of Treason'] },
      opp: { human: true, bf: ['Grizzly Bears', 'Hill Giant', 'Forest*4'] },
    }),
    'two players',
  ),
  preset(
    'Chain of Vapor',
    board({
      you: { bf: ['Island*3', 'Grizzly Bears'], hand: ['Chain of Vapor'] },
      opp: [{ human: true, bf: ['Grizzly Bears', 'Forest*4'] }, { human: true, bf: ['Hill Giant', 'Mountain*3'] }],
    }),
    'three players',
  ),
  preset(
    'Sink into Stupor // Soporific Springs',
    board({
      you: { bf: ['Island*6', 'Grizzly Bears'], hand: ['Sink into Stupor*2'] },
      opp: { human: true, bf: ['Grizzly Bears', 'Mountain*2', 'Forest*2', 'Swamp'], hand: ['Lightning Bolt', 'Abrupt Decay'] },
      turn: 0,
    }),
    "on the opponent's turn: Sit at Bob to cast",
  ),
  preset(
    'Wandering Archaic // Explore the Vastlands',
    board({
      you: { bf: ['Wandering Archaic', 'Island*3'] },
      opp: { human: true, bf: ['Mountain'], hand: ['Lightning Bolt'] },
      turn: 0,
    }),
    'Part A, the opponent with one Mountain',
  ),
  preset(
    'Wandering Archaic // Explore the Vastlands',
    board({
      you: { bf: ['Wandering Archaic', 'Island*3'] },
      opp: { human: true, bf: ['Mountain*3'], hand: ['Lightning Bolt'] },
      turn: 0,
    }),
    'Part A, the opponent with three lands',
  ),
  preset(
    'Wandering Archaic // Explore the Vastlands',
    board({
      you: {
        bf: ['Island*3'],
        hand: ['Wandering Archaic'],
        lib: ['Forest', 'Lightning Bolt', 'Grizzly Bears', 'Island', 'Opt'],
      },
      opp: { human: true, lib: ['Mountain', 'Divination', 'Hill Giant', 'Plains', 'Shock'] },
    }),
    'Part B, Explore the Vastlands',
  ),
  preset(
    "Thassa's Oracle",
    board({ you: { bf: ['Island*2'], hand: ["Thassa's Oracle"], lib: ['Forest', 'Mountain'] }, opp: { lib: ['Mountain*40'] }, fill: 0 }),
    '(a) a library of 2',
  ),
  preset(
    "Thassa's Oracle",
    board({
      you: { bf: ['Island*2'], hand: ["Thassa's Oracle"], lib: ['Grizzly Bears', 'Lightning Bolt', 'Forest', 'Island', 'Opt'] },
      opp: { lib: ['Mountain*40'] },
      fill: 0,
    }),
    '(b) a library of 5',
  ),
  preset(
    "Thassa's Oracle",
    board({
      you: { bf: ['Island*2', 'Laboratory Maniac'], hand: ["Thassa's Oracle"], lib: ['Forest', 'Mountain', 'Plains'] },
      opp: { lib: ['Mountain*40'] },
      fill: 0,
    }),
    '(c) Laboratory Maniac, a library of 3',
  ),
  preset(
    "Pact of Negation, Summoner's Pact",
    board({
      you: {
        bf: ['Island*4', 'Forest*3'],
        hand: ['Pact of Negation', "Summoner's Pact"],
        lib: ['Hill Giant', 'Grizzly Bears', 'Craw Wurm', 'Llanowar Elves'],
      },
      opp: { human: true, bf: ['Forest*2', 'Swamp*2', 'Island*2'], hand: ['Grizzly Bears', 'Abrupt Decay', 'Counterspell'] },
      turn: 0,
    }),
    "on the opponent's turn: Sit at Bob to cast",
  ),
  preset(
    'Mirrodin Besieged',
    board({
      you: { bf: ['Island*3'], hand: ['Mirrodin Besieged', 'Sol Ring', 'Mind Stone'], gy: ['Ornithopter*7', 'Memnite*7'] },
      opp: [{ bf: ['Forest', 'Swamp'], hand: ['Abrupt Decay'] }, {}],
    }),
    'three players, 14 artifacts in the graveyard',
  ),
  preset(
    'Weaver of Harmony, Virtue of Knowledge // Vantress Visions, Mirrormade',
    board({
      you: {
        bf: ['Weaver of Harmony*2', 'Prodigal Sorcerer', 'Forest*4', 'Plains*3', 'Island*4'],
        hand: ['Banishing Light', 'Mirrormade', 'Virtue of Knowledge'],
      },
      opp: { human: true, bf: ['Grizzly Bears', 'Llanowar Elves', 'Mind Stone', 'Forest', 'Swamp'], hand: ['Abrupt Decay'] },
    }),
  ),
  preset(
    'Sword of Wealth and Power, Thunderclap Drake, Primal Amulet // Primal Wellspring',
    board({
      you: {
        cmd: ['Krenko, Mob Boss'],
        bf: [
          'Grizzly Bears',
          { name: 'Sword of Wealth and Power', attach: 'Grizzly Bears' },
          'Thunderclap Drake',
          { name: 'Primal Amulet', counters: { charge: 3 } },
          'Mountain*5',
          'Island*5',
        ],
        hand: ['Lightning Bolt*3', 'Opt', 'Hill Giant'],
      },
      opp: { human: true, bf: ['Prodigal Sorcerer', 'Mountain', 'Island*2'], hand: ['Lightning Bolt', 'Counterspell'] },
    }),
    'Krenko has not been cast yet: the Drake copies none until it is',
  ),
  preset(
    'Reverberate, Dualcaster Mage, Kitsa, Otterball Elite',
    board({
      you: { bf: ['Mountain*6', 'Grizzly Bears'], hand: ['Reverberate', 'Dualcaster Mage'] },
      opp: { human: true, bf: ['Grizzly Bears', 'Mountain*3', 'Island*3'], hand: ['Lightning Bolt', 'Divination', 'Izzet Charm'] },
      turn: 0,
    }),
    "on the opponent's turn: Sit at Bob to cast",
  ),
  preset(
    'Reverberate, Dualcaster Mage, Kitsa, Otterball Elite',
    board({ you: { bf: ['Kitsa, Otterball Elite', 'Island*5'], hand: ['Opt', 'Brainstorm'] } }),
    'Kitsa, on your turn',
  ),
  preset(
    'Jin-Gitaxias, Progress Tyrant',
    board({
      you: { bf: ['Jin-Gitaxias, Progress Tyrant', 'Island*4'], hand: ['Sol Ring*2', 'Opt'] },
      opp: [{ human: true, bf: ['Mountain*2'], hand: ['Lightning Bolt'] }, { human: true, bf: ['Mountain*2'], hand: ['Shock'] }],
    }),
  ),
  preset(
    'Laboratory Maniac, Jace, Wielder of Mysteries, Platinum Angel, Herald of Eternal Dawn, Notion Thief',
    board({
      you: { bf: ['Laboratory Maniac', 'Island*4'], hand: ['Divination', 'Opt'], lib: ['Forest'] },
      opp: { lib: ['Mountain*40'] },
      fill: 0,
    }),
    'base: a library of 1',
  ),
  preset(
    'Laboratory Maniac, Jace, Wielder of Mysteries, Platinum Angel, Herald of Eternal Dawn, Notion Thief',
    board({
      you: { bf: ['Laboratory Maniac', 'Island*4'], hand: ['Divination', 'Opt'] },
      opp: { bf: ['Platinum Angel'], lib: ['Mountain*40'] },
      fill: 0,
    }),
    "(i) the opponent's Platinum Angel, an empty library",
  ),
  preset(
    'Laboratory Maniac, Jace, Wielder of Mysteries, Platinum Angel, Herald of Eternal Dawn, Notion Thief',
    board({
      you: { life: 1, bf: ['Platinum Angel', 'Plains*3', 'Island*3'], hand: ['Herald of Eternal Dawn', 'Swords to Plowshares'] },
      opp: { human: true, bf: ['Mountain*2'], hand: ['Lightning Bolt'] },
    }),
    '(ii) your Platinum Angel at 1 life',
  ),
  preset(
    'Laboratory Maniac, Jace, Wielder of Mysteries, Platinum Angel, Herald of Eternal Dawn, Notion Thief',
    board({
      you: { bf: ['Laboratory Maniac', 'Notion Thief', 'Island*2'] },
      opp: { human: true, bf: ['Island*3'], hand: ['Divination'], lib: ['Mountain*40'] },
      turn: 0,
      fill: 0,
    }),
    '(iii) Notion Thief, an empty library',
  ),
  preset(
    'Laboratory Maniac, Jace, Wielder of Mysteries, Platinum Angel, Herald of Eternal Dawn, Notion Thief',
    board({
      you: {
        bf: [{ name: 'Jace, Wielder of Mysteries', counters: { loyalty: 8 } }, 'Island*3'],
        lib: ['Forest', 'Mountain', 'Plains', 'Island', 'Swamp'],
      },
      opp: { lib: ['Mountain*40'] },
      fill: 0,
    }),
    '(iv) Jace at 8 loyalty, a library of 5',
  ),
  preset(
    "Angel's Grace",
    board({
      you: { life: 3, bf: ['Plains*2'], hand: ["Angel's Grace"] },
      opp: {
        human: true,
        bf: ['Vampire Nighthawk', 'Serra Angel', 'Mountain*2', 'Swamp*2'],
        hand: ['Lightning Bolt', 'Sign in Blood'],
      },
      turn: 0,
      step: 'begin-combat',
    }),
    "the opponent's beginning of combat: Sit at Bob and attack with both",
  ),
  preset(
    'Everybody Lives!',
    board({
      you: {
        bf: ['Plains*2', 'Swamp*3', 'Island', 'Grizzly Bears'],
        hand: ['Everybody Lives!', 'Toxic Deluge', 'Dismember', 'Steam Vents', "Night's Whisper"],
      },
      opp: { human: true, bf: ['Hill Giant', 'Llanowar Elves', 'Mountain*2'], hand: ['Lightning Bolt'] },
    }),
  ),
  preset(
    '(a player leaving during their own turn), Toxic Deluge, Pact of Negation',
    board({
      you: {
        life: 3,
        bf: ['Swamp*3', 'Grizzly Bears'],
        hand: ['Toxic Deluge', 'Forest*3', 'Island*3', 'Mountain*3'],
      },
      opp: [{ bf: ['Hill Giant'] }, { bf: ['Craw Wurm'] }],
    }),
    'three players: alice at 3 life',
  ),
  ...(
    [
      ['Felidar Sovereign at exactly 40', { you: { life: 40, bf: ['Felidar Sovereign', 'Plains*3'] }, opp: { human: true, bf: ['Mountain'], hand: ['Lightning Bolt'] } }],
      ['Triskaidekaphile, 13 in hand', { you: { bf: ['Triskaidekaphile', 'Island*2'], hand: ['Forest*13'] } }],
      ['Helix Pinnacle at 99', { you: { bf: [{ name: 'Helix Pinnacle', counters: { tower: 99 } }, 'Forest*2'] }, opp: { human: true, bf: ['Forest', 'Swamp'], hand: ['Abrupt Decay'] } }],
      ['Simic Ascendancy at 19', { you: { bf: [{ name: 'Simic Ascendancy', counters: { growth: 19 } }, 'Grizzly Bears', 'Forest*2', 'Island*2'] } }],
      ['Revel in Riches, 9 Treasures', { you: { bf: ['Revel in Riches', 'Treasure Token*9', 'Grizzly Bears', 'Mountain*2'], hand: ['Lightning Bolt*2'] }, opp: { bf: ['Llanowar Elves'] } }],
      ['Hellkite Tyrant, three players', { you: { bf: ['Hellkite Tyrant'] }, opp: [{ bf: ['Sol Ring', 'Mind Stone'] }, { bf: ['Sol Ring'] }] }],
      ['Knuckles the Echidna', { you: { bf: ['Knuckles the Echidna', 'Grizzly Bears'] } }],
    ] as const
  ).map(([variant, b]) =>
    preset(
      'Felidar Sovereign, Test of Endurance, Triskaidekaphile, Helix Pinnacle, Simic Ascendancy, Revel in Riches, Hellkite Tyrant, Knuckles the Echidna',
      board({ ...(b as BoardOpts), ...(variant.startsWith('Hellkite') || variant.startsWith('Knuckles') || variant.startsWith('Simic') || variant.startsWith('Revel') || variant.startsWith('Helix') ? {} : { step: 'end' as const }) }),
      variant,
    ),
  ),
  preset(
    'Twenty-Toed Toad, Reliquary Tower',
    board({ you: { bf: ['Twenty-Toed Toad', 'Island*2'], hand: ['Reliquary Tower', 'Forest*24'] } }),
    'Run 1: the Tower played after the Toad',
  ),
  preset(
    'Twenty-Toed Toad, Reliquary Tower',
    board({ you: { bf: ['Reliquary Tower', 'Island*3', 'Forest*2'], hand: ['Twenty-Toed Toad', 'Forest*24'] } }),
    'Run 2: the Toad cast after the Tower',
  ),
  preset(
    'Twenty-Toed Toad, Reliquary Tower',
    board({ you: { bf: ['Twenty-Toed Toad', 'Grizzly Bears'], hand: ['Forest*19'] } }),
    'Run 3: 19 in hand, attack with both',
  ),
  preset(
    'Approach of the Second Sun, Reverberate',
    board({
      you: {
        bf: ['Plains*8', 'Mountain*2', 'Island*4'],
        hand: ['Approach of the Second Sun*2', 'Reverberate', 'Divination*2'],
        lib: ['Forest', 'Mountain', 'Island', 'Swamp', 'Plains', 'Grizzly Bears', 'Hill Giant', 'Craw Wurm', 'Opt', 'Shock'],
      },
      opp: { human: true, bf: ['Island*2'], hand: ['Counterspell'] },
    }),
  ),
  preset(
    'Vorpal Sword, Summon: Primal Odin, Platinum Angel',
    board({
      you: { bf: ['Grizzly Bears', { name: 'Vorpal Sword', attach: 'Grizzly Bears' }, 'Swamp*8'] },
      opp: [{}, {}],
    }),
    'Vorpal Sword, three players',
  ),
  preset(
    'Vorpal Sword, Summon: Primal Odin, Platinum Angel',
    board({
      you: { bf: [{ name: 'Summon: Primal Odin', counters: { lore: 1 } }, 'Swamp*3'], hand: ['Doom Blade'] },
      opp: [{}, {}],
      turn: 'you',
      step: 'upkeep',
    }),
    'Summon: Primal Odin at 1 lore, from your upkeep',
  ),
  preset(
    'Vorpal Sword, Summon: Primal Odin, Platinum Angel',
    board({
      you: { bf: ['Grizzly Bears', { name: 'Vorpal Sword', attach: 'Grizzly Bears' }, 'Swamp*8'] },
      opp: [{ bf: ['Platinum Angel'] }, {}],
    }),
    "Bob's Platinum Angel",
  ),

  // --- Mana abilities: colours chosen, lands' types, doubling ---------------
  preset(
    'Nykthos, Shrine to Nyx, Nyx Lotus',
    board({
      you: {
        bf: ['Nykthos, Shrine to Nyx', 'Gray Merchant of Asphodel', 'Deathrite Shaman', 'Kinnan, Bonder Prodigy', 'Island*3', { name: 'Nyx Lotus', tapped: false }],
        hand: ['Gray Merchant of Asphodel'],
      },
    }),
    'Nykthos and Nyx Lotus',
  ),
  preset(
    'Nykthos, Shrine to Nyx, Nyx Lotus',
    board({
      you: {
        bf: ['Nykthos, Shrine to Nyx', 'Gray Merchant of Asphodel', 'Deathrite Shaman', 'Island*3', 'Mana Reflection', "Mirari's Wake"],
      },
    }),
    "with Mana Reflection and Mirari's Wake",
  ),
  preset(
    'Three Tree City',
    board({ you: { bf: ['Grizzly Bears*2', 'Llanowar Elves', 'Swamp*2'], hand: ['Three Tree City'] } }),
  ),
  preset(
    'Mox Amber, The Grey Havens, Plaza of Heroes, Bloom Tender, Faeburrow Elder',
    board({
      you: {
        bf: ['Mox Amber', 'The Grey Havens', 'Plaza of Heroes', 'Bloom Tender', 'Faeburrow Elder', 'Llanowar Elves', 'Grizzly Bears'],
        hand: ['Teysa Karlov', 'Krenko, Mob Boss', 'Lightning Bolt'],
        gy: ['Grizzly Bears'],
      },
      opp: { bf: ['Teysa Karlov', 'Savannah Lions'], gy: ['Kinnan, Bonder Prodigy'] },
    }),
    'before Teysa',
  ),
  preset(
    'Mox Amber, The Grey Havens, Plaza of Heroes, Bloom Tender, Faeburrow Elder',
    board({
      you: {
        bf: ['Mox Amber', 'The Grey Havens', 'Plaza of Heroes', 'Bloom Tender', 'Faeburrow Elder', 'Llanowar Elves', 'Grizzly Bears', 'Teysa Karlov'],
        hand: ['Krenko, Mob Boss', 'Lightning Bolt'],
        gy: ['Grizzly Bears', 'Teysa Karlov'],
      },
      opp: { bf: ['Savannah Lions'], gy: ['Kinnan, Bonder Prodigy'] },
    }),
    'with Teysa on your battlefield and in your graveyard',
  ),
  preset(
    'Chrome Mox',
    board({
      you: { bf: ['Island*2'], hand: ['Chrome Mox', 'Izzet Charm', 'Sol Ring', 'Forest', "Kozilek's Channeler", 'Boomerang'] },
    }),
  ),
  preset(
    "Mirari's Wake, Zendikar Resurgent, Fertile Ground, Utopia Sprawl",
    board({
      you: {
        bf: ["Mirari's Wake", 'Azorius Chancery', 'Forest*2', 'Plains*2', 'Ancient Ziggurat', 'Grizzly Bears'],
        hand: ['Savannah Lions', 'Swords to Plowshares', 'Fertile Ground', 'Utopia Sprawl'],
      },
    }),
    "Mirari's Wake",
  ),
  preset(
    "Mirari's Wake, Zendikar Resurgent, Fertile Ground, Utopia Sprawl",
    board({ you: { bf: ['Zendikar Resurgent', 'Forest*3'], hand: ['Grizzly Bears', 'Craw Wurm'] } }),
    'Zendikar Resurgent',
  ),
  preset(
    'Kinnan, Bonder Prodigy',
    board({
      you: {
        bf: ['Kinnan, Bonder Prodigy', 'Azorius Signet', 'Swamp', 'Treasure Token', 'Birds of Paradise', 'Sol Ring', 'Chrome Mox', 'Forest*2', 'Island*2', 'Plains*2', 'Llanowar Elves'],
        hand: ['Grizzly Bears'],
        lib: ['Grizzly Bears', 'Forest', 'Akroan Jailer', 'Opt', 'Hill Giant'],
      },
    }),
  ),
  preset(
    'Deathrite Shaman',
    board({
      you: { bf: ['Deathrite Shaman', 'Swamp', 'Forest'], hand: ['Grizzly Bears'] },
      opp: { human: true, bf: ['Deathrite Shaman', 'Swamp'], gy: ['Forest', 'Lightning Bolt', 'Hill Giant'] },
    }),
  ),
  preset(
    'Culling Ritual, Burnt Offering',
    board({
      you: {
        bf: ['Swamp*2', 'Forest*2', 'Mountain', 'Llanowar Elves', 'Darksteel Relic', 'Gray Merchant of Asphodel'],
        hand: ['Culling Ritual', 'Burnt Offering'],
      },
      opp: { bf: ['Grizzly Bears', 'Soldier Token*2', 'Gray Merchant of Asphodel', 'Plains'] },
    }),
  ),
  preset(
    'Klauth, Unrivaled Ancient',
    board({
      you: { bf: ['Klauth, Unrivaled Ancient', 'Grizzly Bears', 'Mountain', 'Mind Stone'], hand: ['Lightning Bolt', 'Opt', 'Ornithopter'] },
    }),
  ),
  preset(
    'Gwenna, Eyes of Gaea',
    board({
      you: {
        bf: ['Gwenna, Eyes of Gaea', 'Deathrite Shaman', 'Nykthos, Shrine to Nyx', 'Forest*2', 'Swamp', 'Island', 'Plains'],
        hand: ['Alpha Tyrranax', 'Gray Merchant of Asphodel', 'Opt'],
      },
      opp: { gy: ['Lightning Bolt'] },
    }),
  ),
  preset(
    'Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve',
    board({ you: { bf: ['Reflecting Pool', { name: 'Forest', tapped: true }, 'Reliquary Tower'] }, opp: { bf: ['Mountain'] } }),
    'A: Reflecting Pool, a tapped Forest',
  ),
  preset(
    'Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve',
    board({ you: { bf: ['Reflecting Pool*2'] }, opp: { bf: ['Mountain'] } }),
    'B: two Reflecting Pools alone',
  ),
  preset(
    'Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve',
    board({ you: { bf: ['Reflecting Pool', 'Exotic Orchard'] }, opp: { bf: ['Swamp'] } }),
    'C: with Exotic Orchard',
  ),
  preset(
    'Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve',
    board({ you: { bf: ['Incubation Druid', 'Spire of Industry', 'Vivid Grove', 'Forest*3', 'Island*2'] } }),
    'D: Incubation Druid',
  ),
  preset(
    'Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve',
    board({ you: { bf: ['Gond Gate', 'Forest'], hand: ['Azorius Guildgate'] } }),
    'E: Gond Gate',
  ),
  preset(
    'Reflecting Pool, Horizon of Progress, Incubation Druid, Gond Gate, Cactus Preserve',
    board({
      you: { cmd: ['Klauth, Unrivaled Ancient'], bf: ['Cactus Preserve', 'Horizon of Progress', 'Forest*3', 'Reliquary Tower'] },
    }),
    'Cactus Preserve and Horizon of Progress, Klauth in the command zone',
  ),
  preset(
    "Reflecting Pool, The Grey Havens, Chrome Mox, Mox Amber, Wild Growth, Fertile Ground, Kinnan, Bonder Prodigy, Mirari's Wake",
    board({
      you: {
        bf: [
          'Reflecting Pool',
          { name: 'Wild Growth', attach: 'Reflecting Pool' },
          'The Grey Havens',
          { name: 'Fertile Ground', attach: 'The Grey Havens' },
          "Mirari's Wake",
        ],
      },
    }),
    "Reflecting Pool and The Grey Havens, Mirari's Wake",
  ),
  preset(
    "Reflecting Pool, The Grey Havens, Chrome Mox, Mox Amber, Wild Growth, Fertile Ground, Kinnan, Bonder Prodigy, Mirari's Wake",
    board({ you: { bf: ['Kinnan, Bonder Prodigy', 'Chrome Mox', 'Mox Amber'] } }),
    'Kinnan, Chrome Mox and Mox Amber',
  ),
  preset(
    'Mana Flare, Heartbeat of Spring',
    board({
      you: { bf: ['Forest*2', 'Azorius Chancery', 'Cavern of Souls'], hand: ['Grizzly Bears'] },
      opp: { human: true, bf: ['Mana Flare', 'Mountain'], hand: ['Shock', 'Hill Giant'] },
    }),
    'Mana Flare',
  ),
  preset(
    'Mana Flare, Heartbeat of Spring',
    board({
      you: { bf: ['Forest*2', 'Azorius Chancery'], hand: ['Grizzly Bears'] },
      opp: { human: true, bf: ['Heartbeat of Spring', 'Mountain'], hand: ['Hill Giant'] },
    }),
    'Heartbeat of Spring',
  ),
  preset(
    'Mana Reflection, Nyxbloom Ancient',
    board({
      you: {
        bf: ['Mana Reflection', 'Forest', { name: 'Wild Growth', attach: 'Forest' }, 'Birds of Paradise', 'Gilded Lotus', 'Ancient Ziggurat', 'Forest'],
        hand: ['Plated Seastrider', 'Expressive Iteration', 'Opt'],
      },
    }),
    'one Mana Reflection',
  ),
  preset(
    'Mana Reflection, Nyxbloom Ancient',
    board({ you: { bf: ['Mana Reflection*2', 'Nyxbloom Ancient', 'Forest'] } }),
    'two Mana Reflections and Nyxbloom Ancient',
  ),
  preset(
    'Mana Reflection, Nyxbloom Ancient',
    board({ you: { bf: ['Forest'] }, opp: { bf: ['Mana Reflection'] } }),
    "only the opponent's Mana Reflection",
  ),
  // --- Library ordering and cards chosen as a cost ---------------------------
  preset(
    'Aragorn, the Uniter, Preordain, Opt, Consider',
    board({
      you: {
        bf: ['Aragorn, the Uniter', 'Island*3'],
        hand: ['Preordain', 'Opt', 'Consider'],
        lib: ['Grizzly Bears', 'Hill Giant', 'Craw Wurm', 'Llanowar Elves', 'Serra Angel', 'Shivan Dragon'],
      },
    }),
    'distinct cards on top',
  ),
  preset(
    'Aragorn, the Uniter, Preordain, Opt, Consider',
    board({ you: { bf: ['Aragorn, the Uniter', 'Island*3'], hand: ['Opt'], lib: ['Grizzly Bears*2', 'Hill Giant'] } }),
    'two copies of one card on top',
  ),
  preset(
    'Stock Up, Dig Through Time, Experimental Augury, Growing Rites of Itlimoc // Itlimoc, Cradle of the Sun',
    board({
      you: {
        bf: ['Island*6', 'Forest*4', { name: 'Grizzly Bears', counters: { '+1/+1': 1 } }, 'Llanowar Elves', 'Hill Giant', 'Craw Wurm'],
        hand: ['Stock Up', 'Dig Through Time', 'Experimental Augury', 'Growing Rites of Itlimoc'],
        gy: ['Opt*3', 'Shock*3'],
        lib: ['Island', 'Grizzly Bears', 'Craw Wurm', 'Lightning Bolt', 'Opt', 'Hill Giant', 'Llanowar Elves', 'Serra Angel', 'Divination', 'Shivan Dragon'],
      },
    }),
  ),
  preset(
    "Halimar Depths, Sensei's Divining Top",
    board({
      you: { bf: ["Sensei's Divining Top", 'Island'], hand: ['Halimar Depths'], lib: ['Grizzly Bears', 'Hill Giant', 'Craw Wurm'] },
    }),
  ),
  preset(
    'Valakut Awakening // Valakut Stoneforge',
    board({ you: { bf: ['Mountain*3'], hand: ['Valakut Awakening*2', 'Grizzly Bears', 'Hill Giant', 'Craw Wurm'] } }),
  ),
  preset(
    "Teferi's Puzzle Box",
    board({ you: { bf: ["Teferi's Puzzle Box"] }, opp: { human: true, hand: ['Grizzly Bears', 'Lightning Bolt'] }, step: 'end' }),
    'one Box, from your end step',
  ),
  preset(
    "Teferi's Puzzle Box",
    board({ you: { bf: ["Teferi's Puzzle Box*2"] }, opp: { human: true, hand: ['Grizzly Bears', 'Lightning Bolt'] }, step: 'end' }),
    'two Boxes, from your end step',
  ),
  preset(
    "Valakut Awakening, Teferi's Puzzle Box, Brainstorm",
    board({
      you: {
        bf: ['Mountain*3', 'Island'],
        hand: [{ name: 'Krenko, Mob Boss', commander: true }, 'Hill Giant', 'Valakut Awakening', 'Brainstorm'],
      },
    }),
    'your commander in hand',
  ),
  preset(
    "Valakut Awakening, Teferi's Puzzle Box, Brainstorm",
    board({
      you: { bf: ["Teferi's Puzzle Box"] },
      opp: { human: true, hand: [{ name: 'Teysa Karlov', commander: true }, 'Hill Giant'] },
      step: 'end',
    }),
    "Puzzle Box, the opponent's commander in hand",
  ),
  preset(
    'Moorland Haunt, Mines of Moria, Varina, Lich Queen, Psychic Frog, Drivnod, Carnage Dominus',
    board({
      you: {
        bf: ['Moorland Haunt', 'Plains', 'Island', 'Mines of Moria', 'Mountain*4', 'Varina, Lich Queen', 'Forest*2', 'Psychic Frog', 'Drivnod, Carnage Dominus', 'Swamp*2'],
        hand: ['Mines of Moria'],
        gy: ['Wastes', 'Grizzly Bears', 'Hill Giant', 'Craw Wurm', 'Opt', 'Shock', 'Divination'],
      },
    }),
  ),
  preset(
    'Key to the City, Ghostly Pilferer',
    board({
      you: {
        bf: ['Key to the City', 'Ghostly Pilferer', 'Grizzly Bears', 'Island*4', 'Voltaic Key'],
        hand: ['Opt', 'Shock', 'Forest'],
      },
    }),
  ),
  preset(
    "Sensei's Divining Top",
    board({
      you: { bf: ["Sensei's Divining Top", 'Island'], lib: ['Grizzly Bears', 'Hill Giant', 'Craw Wurm'] },
      opp: { human: true, bf: ['Island'], hand: ['Unsummon'] },
    }),
  ),
  preset(
    'Psychic Frog, Moorland Haunt, Thrill of Possibility, Nezahal, Primal Tide',
    board({
      you: {
        bf: ['Psychic Frog', 'Moorland Haunt', 'Plains', 'Island', 'Mountain*2'],
        hand: ['Thrill of Possibility', 'Opt', 'Shock', 'Forest'],
        gy: ['Grizzly Bears', 'Hill Giant'],
      },
      turn: 0,
      step: 'upkeep',
    }),
    "the opponent's upkeep",
  ),
  preset(
    'Mesmeric Orb',
    board({
      you: { bf: ['Mesmeric Orb', { name: 'Grizzly Bears', tapped: true }] },
      opp: { bf: [{ name: 'Forest', n: 3, tapped: true }, { name: 'Soldier Token', n: 5, tapped: true }], hand: ['Steam Vents'] },
      step: 'end',
    }),
    'from your end step (the stolen-creature part needs control effects)',
  ),
  preset(
    'Aragorn, the Uniter',
    board({
      you: {
        bf: ['Aragorn, the Uniter', 'Grizzly Bears', 'Mountain*3', 'Plains*3', 'Forest*2'],
        hand: ['Lightning Bolt', 'Giant Growth', 'Boros Charm', 'Swords to Plowshares'],
      },
      opp: [{}, {}],
    }),
  ),
  preset(
    'Varina, Lich Queen',
    board({ you: { bf: ['Varina, Lich Queen', 'Cemetery Reaper', 'Grizzly Bears'], hand: ['Forest'] } }),
  ),
  preset(
    'Drivnod, Carnage Dominus',
    board({
      you: { bf: ['Drivnod, Carnage Dominus', 'Zulaport Cutthroat', 'Blood Artist', 'Lightless Evangel', 'Viscera Seer', 'Grizzly Bears'] },
    }),
  ),
  preset(
    'Nezahal, Primal Tide, Ghostly Pilferer',
    board({
      you: {
        bf: [{ name: 'Nezahal, Primal Tide', counters: { '+1/+1': 1 } }, 'Ghostly Pilferer'],
        hand: ['Opt', 'Shock', 'Forest', 'Island'],
      },
      opp: {
        human: true,
        cmd: ['Teysa Karlov'],
        bf: ['Mountain*4', 'Plains*2', 'Swamp*2'],
        hand: ['Lightning Bolt'],
        gy: ['Faithless Looting'],
      },
      turn: 0,
    }),
    "the opponent's main phase: Sit at Bob to cast",
  ),

  // --- Infect, wither, spree and gift ---------------------------------------
  preset(
    'Three Steps Ahead',
    board({
      you: {
        bf: ['Island*3', 'Swamp*3', { name: 'Grizzly Bears', tapped: true, counters: { '+1/+1': 1 } }],
        hand: ['Three Steps Ahead', 'Opt', 'Shock'],
      },
      opp: { human: true, bf: ['Island*2'], hand: ['Divination'] },
      turn: 0,
    }),
    "six lands, the opponent's main phase",
  ),
  preset(
    'Three Steps Ahead',
    board({
      you: { bf: ['Island', 'Swamp*5', { name: 'Grizzly Bears', tapped: true }], hand: ['Three Steps Ahead', 'Opt'] },
      opp: { human: true, bf: ['Island*2'], hand: ['Divination'] },
      turn: 0,
    }),
    'one Island and five Swamps',
  ),
  preset(
    'Insatiable Avarice',
    board({
      you: {
        life: 20,
        bf: ['Swamp*5'],
        hand: ['Insatiable Avarice*2'],
        lib: ['Grizzly Bears', 'Hill Giant', 'Craw Wurm', 'Serra Angel', 'Shivan Dragon', 'Lightning Bolt', 'Opt', 'Divination', 'Sol Ring', 'Llanowar Elves'],
      },
      opp: { life: 20 },
    }),
  ),
  preset(
    "Smuggler's Surprise",
    board({
      you: {
        bf: ['Forest*5', 'Island*4', 'Grizzly Bears'],
        hand: ["Smuggler's Surprise", 'Serra Angel'],
        gy: ['Hill Giant'],
        lib: ['Craw Wurm', 'Forest', 'Sol Ring', 'Grizzly Bears'],
      },
    }),
  ),
  preset(
    'Requisition Raid',
    board({
      you: { bf: ['Plains*4', 'Grizzly Bears', 'Hill Giant'], hand: ['Requisition Raid'] },
      opp: [{ bf: ['Sol Ring', 'Craw Wurm'] }, { bf: [{ name: 'Pacifism', attach: 'Hill Giant' }, 'Llanowar Elves', 'Serra Angel'] }],
    }),
  ),
  preset(
    "Dawn's Truce",
    board({
      you: { bf: ['Plains*4', 'Grizzly Bears', 'Sol Ring'], hand: ["Dawn's Truce*3"] },
      opp: [{ human: true, bf: ['Island*2'], hand: ['Counterspell'] }, {}, {}],
    }),
    'four players',
  ),
  preset(
    "Dawn's Truce",
    board({ you: { bf: ['Plains*4', 'Grizzly Bears', 'Sol Ring'], hand: ["Dawn's Truce*3"] } }),
    'two players',
  ),
  preset(
    "Into the Flood Maw, Long River's Pull, Wear Down, Peerless Recycling, Sazacap's Brew",
    board({
      you: {
        bf: ['Island*2', 'Forest*2', 'Mountain*2', 'Grizzly Bears'],
        hand: ['Into the Flood Maw', "Long River's Pull", 'Wear Down', 'Peerless Recycling', "Sazacap's Brew", 'Opt'],
        gy: ['Grizzly Bears', 'Sol Ring', 'Lightning Bolt'],
      },
      opp: { human: true, bf: ['Sol Ring', 'Rhystic Study', 'Island*3'], hand: ['Divination'] },
    }),
  ),
  preset(
    'Octomancer',
    board({
      you: { bf: ['Forest*3', 'Island*2'], hand: ['Octomancer'] },
      opp: { human: true, bf: ['Plains*2'], hand: ['Raise the Alarm'] },
    }),
  ),
  preset(
    'Final Showdown',
    board({
      you: { bf: ['Plains*8', 'Grizzly Bears', 'Doomed Traveler'], hand: ['Final Showdown*2'] },
      opp: { bf: ['Darksteel Myr', 'Doomed Traveler'] },
    }),
  ),
  preset(
    'Parting Gust',
    board({
      you: { bf: ['Plains*4', 'Wall of Omens', { name: 'Pacifism', attach: 'Serra Angel' }], hand: ['Parting Gust*2'] },
      opp: { bf: ['Serra Angel', 'Hill Giant', 'Soldier Token'] },
    }),
  ),
  preset(
    'Starfall Invocation, Coiling Rebirth',
    board({
      you: {
        bf: ['Plains*5', 'Swamp*5', 'Hill Giant', 'Wall of Omens', 'Soldier Token'],
        hand: ['Starfall Invocation', 'Coiling Rebirth*2'],
        gy: ['Serra Angel', 'Skithiryx, the Blight Dragon'],
      },
      opp: { bf: ['Grizzly Bears', 'Doomed Traveler'] },
    }),
  ),
  preset(
    'Scrapshooter',
    board({
      you: { bf: ['Forest*6'], hand: ['Scrapshooter*2'] },
      opp: { human: true, bf: ['Sol Ring', 'Rhystic Study', 'Plains'], hand: ['Swords to Plowshares'] },
    }),
    'the opponent with an artifact and an enchantment',
  ),
  preset(
    'Scrapshooter',
    board({ you: { bf: ['Forest*6'], hand: ['Scrapshooter*2'] }, opp: { bf: ['Plains'] } }),
    'the opponent with neither',
  ),
  preset(
    'Blighted Agent, Plague Myr, Ichorclaw Myr, Inkmoth Nexus',
    board({
      you: {
        bf: ['Blighted Agent', 'Plague Myr', 'Ichorclaw Myr', 'Inkmoth Nexus', 'Island*3'],
        hand: ['Inkmoth Nexus'],
      },
      opp: { human: true, life: 20, bf: ['Wall of Wood', { name: 'Hill Giant', counters: { '+1/+1': 1 } }, 'Ajani, Caller of the Pride'] },
    }),
    'play the second Inkmoth Nexus from hand',
  ),
  preset(
    'Phyresis, Tainted Strike, Triumph of the Hordes',
    board({
      you: {
        bf: ['Prodigal Pyromancer', 'Grizzly Bears', 'Basilisk Collar', 'Swamp*3', 'Forest*3', 'Mountain*3'],
        hand: ['Phyresis', 'Tainted Strike', 'Triumph of the Hordes', 'Fling'],
      },
      opp: { poison: 6, bf: ['Llanowar Elves', 'Hill Giant'] },
    }),
  ),
  preset(
    'Skithiryx, the Blight Dragon',
    board({
      you: { cmd: ['Skithiryx, the Blight Dragon'], bf: ['Swamp*8'] },
      opp: [{}, { bf: ['Craw Wurm'] }],
    }),
    'cast Skithiryx from the command zone (commander damage starts at 0)',
  ),
  preset(
    'Massacre Girl, Known Killer, Necroskitter, Midnight Banshee, Hapatra, Vizier of Poisons',
    board({
      you: {
        bf: ['Massacre Girl, Known Killer', 'Necroskitter', 'Hapatra, Vizier of Poisons', 'Prodigal Pyromancer', 'Grizzly Bears', 'Swamp*4'],
        hand: ['Midnight Banshee', 'Doom Blade'],
      },
      opp: { human: true, life: 20, bf: ['Llanowar Elves', 'Hill Giant', 'Soldier Token', 'Grizzly Bears'] },
    }),
  ),
  preset(
    'Phyrexian Swarmlord, Ichor Rats',
    board({
      you: { poison: 2, bf: ['Phyrexian Swarmlord'] },
      opp: [{ poison: 3 }, { poison: 2 }, {}],
      turn: 2,
      step: 'end',
    }),
    "(a) four players, from the end of Dave's turn",
  ),
  preset(
    'Phyrexian Swarmlord, Ichor Rats',
    board({ you: { poison: 9, bf: ['Swamp*3'], hand: ['Ichor Rats'] }, opp: { poison: 9 } }),
    '(b) both at 9 poison',
  ),
  // --- Notion Thief, copied abilities, a departed player's permanents -------
  preset(
    'Strionic Resonator',
    board({
      you: {
        bf: ['Strionic Resonator*3', 'Prodigal Sorcerer', 'Flameshadow Conjuring', 'Plains*4', 'Forest*3', 'Mountain*3', 'Island*2'],
        hand: ['Elvish Visionary', 'Banishing Light', 'History of Benalia', 'Grizzly Bears'],
      },
      opp: { human: true, bf: ['Grizzly Bears', 'Llanowar Elves', 'Forest*2'], hand: ['Elvish Visionary', 'Naturalize'] },
    }),
  ),
  preset(
    "Peter Parker's Camera, Lithoform Engine",
    board({
      you: { bf: ['Prodigal Sorcerer', 'Lithoform Engine', 'Island*5', 'Forest*5'], hand: ["Peter Parker's Camera", 'Elvish Visionary'] },
      opp: { bf: ['Llanowar Elves'] },
    }),
  ),
  preset(
    "Battlemage's Bracers",
    board({
      you: { bf: ["Battlemage's Bracers", 'Llanowar Elves', 'Mountain*4', 'Forest*2'], hand: ['Prodigal Sorcerer'] },
      opp: { life: 20, bf: ['Llanowar Elves'] },
    }),
  ),
  preset(
    'Increasing Vengeance, Reverberate, Essence Scatter, Frolicking Familiar, Fling',
    board({
      you: {
        bf: ['Mountain*10', 'Island*3', 'Grizzly Bears'],
        hand: ['Lightning Bolt*2', 'Increasing Vengeance', 'Frolicking Familiar', 'Reverberate', 'Fling', 'Grizzly Bears'],
      },
      opp: { human: true, life: 20, bf: ['Grizzly Bears', 'Llanowar Elves', 'Island*2'], hand: ['Essence Scatter', 'Lightning Bolt'] },
    }),
  ),
  preset(
    'Ixhel, Scion of Atraxa',
    board({
      you: { bf: ['Ixhel, Scion of Atraxa', 'Plains*6'] },
      opp: [
        { poison: 3, lib: ['Lightning Bolt', 'Mountain'], hand: ['Doom Blade'], bf: ['Swamp*2'] },
        { poison: 2, lib: ['Grizzly Bears'] },
      ],
    }),
  ),
  preset(
    'Notion Thief',
    board({
      you: { bf: ['Notion Thief', 'Island*3'], hand: ['Notion Thief'], lib: ['Grizzly Bears', 'Hill Giant'] },
      opp: {
        human: true,
        bf: ['Howling Mine', 'Phyrexian Arena', 'Mountain*3', 'Island*3'],
        hand: ['Faithless Looting', 'Divination', 'Wheel of Fortune'],
        lib: ['Lightning Bolt', 'Shock', 'Opt'],
      },
      step: 'end',
    }),
    'from your end step',
  ),
  preset(
    'Molten Echoes, Flameshadow Conjuring',
    board({
      you: {
        bf: ['Flameshadow Conjuring', 'Mountain*8', 'Forest*4'],
        hand: ['Molten Echoes', 'Elvish Visionary', 'Llanowar Elves', 'Grizzly Bears', 'Briarpack Alpha'],
      },
    }),
  ),
  preset(
    'Boseiju, Who Endures, (a player who has left the game)',
    board({
      you: { bf: ['Forest*2', 'Mountain*2', 'Scavenging Ooze'], hand: ['Boseiju, Who Endures', 'Lightning Bolt*2'] },
      opp: [{ bf: ['Tarnished Citadel', 'Hill Giant'] }, { life: 3, bf: ['Tarnished Citadel', 'Grizzly Bears'], gy: ['Opt'] }],
    }),
  ),

  // --- The Tarkir precons, first half ---------------------------------------
  preset(
    "Dismantling Wave, Windgrace's Judgment, Afterlife from the Loam, The Balrog of Moria (dies trigger)",
    board({
      you: {
        bf: ['Sol Ring', 'The Balrog of Moria', 'Plains*8', 'Swamp*8', 'Forest*8'],
        hand: ['Dismantling Wave', "Windgrace's Judgment", 'Afterlife from the Loam', 'Doom Blade'],
        gy: ['Grizzly Bears', 'Opt*2', 'Shock*2'],
      },
      opp: [
        { bf: ['Sol Ring', 'Mind Stone', 'Grizzly Bears'], gy: ['Craw Wurm', 'Serra Angel'] },
        { bf: ['Ghostly Prison', 'Island', 'Serra Angel'], gy: ['Giant Spider'] },
        { bf: ['Craw Wurm'] },
      ],
    }),
    'four players',
  ),
  preset(
    'Fractured Sanity, Decree of Pain, Agonasaur Rex, Titanoth Rex, Vizier of Tumbling Sands, Magmakin Artillerist, The Balrog of Moria (cycling), Dismantling Wave (cycling)',
    board({
      you: {
        bf: ['Magmakin Artillerist', 'Grizzly Bears', { name: 'Island', tapped: true }, 'Island*4', 'Swamp*4', 'Mountain*4', 'Forest*4', 'Plains*4'],
        hand: [
          'Fractured Sanity',
          'Decree of Pain',
          'Agonasaur Rex',
          'Titanoth Rex',
          'Vizier of Tumbling Sands',
          'Magmakin Artillerist',
          'The Balrog of Moria',
          'Migratory Route',
          'Think Twice',
          'Dismantling Wave',
        ],
      },
      opp: { human: true, bf: ['Serra Angel', 'Grand Abolisher', 'Plains*3', 'Forest*3'], hand: ["Angel's Grace", 'Krosan Grip'] },
    }),
  ),
  preset(
    'Command Beacon, Hellkite Courser',
    board({
      you: { cmd: ['Krenko, Mob Boss'], bf: ['Command Beacon', 'Mountain*10'], hand: ['Hellkite Courser', 'Lightning Bolt'] },
      opp: { cmd: ['Teysa Karlov'] },
    }),
  ),
  preset(
    'Will of the Abzan, Priest of Forgotten Gods, Crackling Doom, Soul Shatter, Will of the Mardu',
    board({
      you: {
        bf: [
          { name: 'Krenko, Mob Boss', commander: true },
          'Priest of Forgotten Gods',
          'Grizzly Bears*2',
          'Mountain*6',
          'Plains*6',
          'Swamp*6',
          'Forest*2',
        ],
        hand: ['Will of the Abzan', 'Crackling Doom', 'Soul Shatter', 'Will of the Mardu'],
        gy: ['Serra Angel'],
        life: 20,
      },
      opp: [
        { life: 20, bf: ['Craw Wurm', 'Grizzly Bears'] },
        { life: 20, bf: ['Craw Wurm*2'] },
        { life: 20, bf: ['Serra Angel', 'Ajani, Caller of the Pride', 'Grizzly Bears'] },
      ],
    }),
    'four players, your commander on the battlefield',
  ),
  preset(
    'Temple of the Dragon Queen',
    board({ you: { hand: ['Temple of the Dragon Queen', 'Shivan Dragon'] } }),
    'A and C: a Dragon in hand, none on the battlefield',
  ),
  preset(
    'Temple of the Dragon Queen',
    board({ you: { bf: ['Shivan Dragon'], hand: ['Temple of the Dragon Queen'] } }),
    'B: a Dragon on the battlefield',
  ),
  preset(
    'Quirion Ranger, Mina and Denn, Wildborn, Multani, Yavimaya\'s Avatar',
    board({
      you: {
        bf: ['Quirion Ranger', 'Mina and Denn, Wildborn', { name: 'Grizzly Bears', tapped: true }, 'Forest', 'Mountain'],
        gy: ["Multani, Yavimaya's Avatar", 'Mountain'],
      },
      opp: { gy: ['Forest'] },
    }),
    'your board',
  ),
  preset(
    'Quirion Ranger, Mina and Denn, Wildborn, Multani, Yavimaya\'s Avatar',
    board({
      you: { bf: ['Quirion Ranger', 'Forest'] },
      opp: { human: true, bf: ['Quirion Ranger', 'Forest*2', { name: 'Grizzly Bears', tapped: true }] },
    }),
    "the opponent's Ranger, two Forests",
  ),
  preset(
    'Myr Battlesphere',
    board({ you: { bf: ['Island*7'], hand: ['Myr Battlesphere'] }, opp: { bf: ['Ajani, Caller of the Pride'] } }),
    'cast it',
  ),
  preset(
    'Myr Battlesphere',
    board({ you: { bf: ['Myr Battlesphere', 'Myr Token*4'] }, opp: { bf: ['Ajani, Caller of the Pride'] } }),
    'on the battlefield with four Myr',
  ),
  preset(
    "Lord of the Forsaken, Welcome the Dead, Teval's Judgment, Essence Anchor, Gravecrawler",
    board({
      you: {
        life: 20,
        bf: ['Lord of the Forsaken', "Teval's Judgment", 'Essence Anchor', 'Swamp*3', 'Island'],
        hand: ['Fractured Sanity', 'Sol Ring', 'Opt', 'Shock'],
        gy: ['Welcome the Dead', 'Gravecrawler'],
      },
    }),
  ),
  preset(
    'Wonder, Anger, Brawn, Filth',
    board({
      you: {
        bf: [{ name: 'Grizzly Bears', sick: true }, 'Grizzly Bears', 'Mountain', 'Forest', 'Swamp', 'Island*2'],
        hand: ['Island', 'Wonder', 'Turn to Frog', 'Doom Blade'],
        gy: ['Anger', 'Brawn', 'Filth'],
      },
      opp: { bf: ['Swamp', 'Grizzly Bears'] },
    }),
  ),
  preset(
    'Legion Warboss, Ainok Strike Leader, Within Range',
    board({
      you: {
        cmd: [],
        bf: [{ name: 'Krenko, Mob Boss', commander: true }, 'Legion Warboss', 'Ainok Strike Leader', 'Within Range', 'Mountain*3'],
        life: 20,
      },
      opp: [{ life: 20 }, { life: 20 }],
    }),
    'three players',
  ),
  preset(
    'Legion Warboss, Ainok Strike Leader, Within Range',
    board({
      you: { bf: [{ name: 'Krenko, Mob Boss', commander: true }, 'Legion Warboss', 'Ainok Strike Leader', 'Mountain*3'] },
      opp: [{ bf: ['Ghostly Prison'] }, {}],
    }),
    'Ghostly Prison under Bob',
  ),
  preset(
    'Divine Visitation, Redoubled Stormsinger, Legion Warboss, Ainok Strike Leader, The Balrog of Moria (cycling, for Treasures)',
    board({
      you: {
        bf: ['Divine Visitation', 'Legion Warboss', 'Ainok Strike Leader', 'Redoubled Stormsinger', 'Goblin Token', 'Mountain*4'],
        hand: ['The Balrog of Moria'],
      },
      opp: [{ bf: ['Legion Warboss'] }, {}],
    }),
  ),
  preset(
    'Sarkhan, Soul Aflame',
    board({
      you: {
        bf: [{ name: 'Sarkhan, Soul Aflame', counters: { '+1/+1': 1 } }, 'Mountain*6'],
        hand: ['Shivan Dragon', 'Lathliss, Dragon Queen', 'Glorybringer', 'Lightning Bolt'],
      },
      opp: { human: true, hand: ['Shivan Dragon'], bf: ['Mountain*6'] },
    }),
  ),
  preset(
    "Colfenor's Urn, Decree of Pain",
    board({
      you: {
        bf: ["Colfenor's Urn", 'Serra Angel', 'Craw Wurm', 'Giant Spider', 'Grizzly Bears', 'Swamp*6', 'Forest*2'],
        hand: ['Giant Growth', 'Decree of Pain'],
      },
      opp: { bf: ['Serra Angel', 'Darksteel Myr'] },
    }),
  ),
  preset(
    'Wall of Roots, Devoted Druid, Tree of Redemption, Tree of Perdition',
    board({
      you: {
        life: 7,
        bf: ['Wall of Roots', 'Devoted Druid', { name: 'Tree of Redemption', counters: { '+1/+1': 2 } }, 'Tree of Perdition', 'Forest'],
        hand: ['Grizzly Bears', 'Llanowar Elves', 'Forest'],
      },
      opp: { life: 31 },
    }),
  ),
  preset(
    'Wall of Roots, Devoted Druid, Tree of Redemption, Tree of Perdition',
    board({ you: { life: 5, bf: ['Tree of Redemption'] }, opp: { bf: ['The Lord of Pain'] } }),
    'The Lord of Pain (set your life to 30 for the second half)',
  ),
  preset(
    'Weathered Sentinels',
    board({
      you: { bf: ['Weathered Sentinels', 'Ajani, Caller of the Pride', 'Grizzly Bears'] },
      opp: [{ human: true, bf: ['Grizzly Bears'] }, { human: true, bf: ['Grizzly Bears'] }],
    }),
  ),

  // --- The Tarkir precons, second half --------------------------------------
  preset(
    'Tasigur, the Golden Fang, Colossal Grave-Reaver',
    board({
      you: {
        bf: ['Tasigur, the Golden Fang', 'Forest*2', 'Island*2'],
        gy: ['Hill Giant', 'Grizzly Bears', 'Island'],
        lib: ['Serra Angel', 'Forest'],
      },
      opp: [{ human: true }, { human: true }],
    }),
    'Run 1, three players',
  ),
  preset(
    'Tasigur, the Golden Fang, Colossal Grave-Reaver',
    board({
      you: {
        bf: ['Tasigur, the Golden Fang', 'Forest*2', 'Island*2'],
        gy: ['Hill Giant', 'Grizzly Bears', 'Island'],
        lib: ['Serra Angel', 'Forest'],
      },
      opp: { human: true },
    }),
    'Run 1b, two players',
  ),
  preset(
    'Tasigur, the Golden Fang, Colossal Grave-Reaver',
    board({
      you: {
        bf: ['Tasigur, the Golden Fang', 'Colossal Grave-Reaver', 'Forest*2', 'Island*2'],
        gy: ['Hill Giant', 'Grizzly Bears', 'Island'],
        lib: ['Serra Angel', 'Craw Wurm'],
      },
      opp: [{ human: true }, { human: true }],
    }),
    'Run 2, with Colossal Grave-Reaver',
  ),
  preset(
    "Selvala's Stampede",
    board({
      you: {
        bf: ['Forest*6'],
        hand: ["Selvala's Stampede", 'Serra Angel'],
        lib: ['Island', 'Grizzly Bears', 'Island', 'Hill Giant', 'Craw Wurm'],
      },
      opp: [{ human: true }, { human: true }],
    }),
  ),
  preset(
    'Gix, Yawgmoth Praetor',
    board({
      you: { bf: ['Gix, Yawgmoth Praetor', 'Grizzly Bears', 'Swamp*7'], hand: ['Opt', 'Shock', 'Forest', 'Island'] },
      opp: [{ human: true, bf: ['Grizzly Bears'], lib: ['Grizzly Bears', 'Forest', 'Hill Giant'] }, {}],
    }),
    'Runs 1 and 2',
  ),
  preset(
    'Gix, Yawgmoth Praetor',
    board({
      you: { bf: ['Gix, Yawgmoth Praetor', 'Rest in Peace', 'Swamp*7', 'Mountain'], hand: ['Opt', 'Shock', 'Forest'] },
      opp: [{ human: true, lib: ['Thrill of Possibility', 'Hill Giant'] }, {}],
    }),
    'Run 3, Rest in Peace',
  ),
  preset(
    'Lethal Scheme',
    board({
      you: {
        bf: ['Swamp*2', 'Island*2', 'Grizzly Bears*2'],
        hand: ['Lethal Scheme', 'Hill Giant', 'Island', 'Twincast', 'Opt', 'Shock', 'Craw Wurm'],
      },
      opp: { human: true, bf: ['Serra Angel*2', 'Swamp*2'], hand: ['Murder'] },
    }),
  ),
  preset(
    'Necropolis Fiend, Moorland Haunt',
    board({ you: { bf: ['Necropolis Fiend', 'Swamp*2'], gy: ['Grizzly Bears', 'Hill Giant', 'Island'] }, opp: { bf: ['Serra Angel'] } }),
    'Run 1',
  ),
  preset(
    'Necropolis Fiend, Moorland Haunt',
    board({ you: { bf: ['Necropolis Fiend', 'Swamp*3'], gy: ['Grizzly Bears'] }, opp: { bf: ['Serra Angel'] } }),
    'Run 2, one card in the graveyard',
  ),
  preset(
    'Necropolis Fiend, Moorland Haunt',
    board({ you: { bf: ['Moorland Haunt', 'Plains', 'Island'], gy: ['Island'], hand: ['Grizzly Bears', 'Hill Giant'] } }),
    'Run 3, Moorland Haunt (discard creatures to add them)',
  ),
  preset(
    'Shigeki, Jukai Visionary',
    board({
      you: {
        bf: ['Shigeki, Jukai Visionary', 'Forest*10'],
        lib: ['Forest', 'Grizzly Bears', 'Swamp', 'Hill Giant'],
        gy: ['Grizzly Bears', 'Hill Giant', 'Baldin, Century Herdmaster'],
      },
    }),
  ),
  preset(
    'Steward of the Harvest',
    board({
      you: {
        bf: ['Grizzly Bears', { name: 'Grizzly Bears', sick: true }, 'Forest*5'],
        hand: ['Steward of the Harvest', 'Giant Growth'],
        gy: ['Forest', 'Evolving Wilds', 'Island'],
      },
    }),
  ),
  preset(
    'Sepulchral Primordial, Diluvian Primordial',
    board({
      you: {
        bf: ['Swamp*7', 'Island*7', 'Ingenious Artillerist'],
        hand: ['Sepulchral Primordial', 'Diluvian Primordial'],
      },
      opp: [
        { gy: ['Hill Giant', 'Serra Angel', 'Lightning Bolt', 'Ornithopter'] },
        { gy: ['Grizzly Bears', 'Shock', 'Ornithopter'] },
      ],
    }),
  ),
  preset(
    'Combustible Gearhulk',
    board({
      you: { bf: ['Mountain*6'], hand: ['Combustible Gearhulk'], lib: ['Fireball', 'Grizzly Bears', 'Hill Giant'] },
      opp: { human: true },
    }),
    'Runs 1 and 2',
  ),
  preset(
    'Combustible Gearhulk',
    board({
      you: { bf: ['Mountain*6'], hand: ['Combustible Gearhulk'], lib: ['Fireball', 'Grizzly Bears'] },
      opp: { human: true, lib: ['Mountain*40'] },
      fill: 0,
    }),
    'Run 3, two cards left in your library',
  ),
  preset(
    'Dauthi Voidwalker',
    board({
      you: { bf: ['Dauthi Voidwalker', 'Grizzly Bears', 'Swamp*4'], hand: ['Murder*2'] },
      opp: { human: true, bf: ['Grizzly Bears', 'Goblin Token', 'Island*3', 'Mountain*2'], gy: ['Think Twice'], hand: ['Lava Spike', 'Rest in Peace', 'Plains*2'] },
    }),
  ),
  preset(
    'Territorial Hellkite, Scourge of the Throne',
    board({
      you: { life: 20, bf: ['Territorial Hellkite', 'Scourge of the Throne', 'Plains*2'], hand: ['Revitalize'] },
      opp: [{ life: 40 }, { life: 20 }],
    }),
    'Runs 1 and 3, three players',
  ),
  preset(
    'Territorial Hellkite, Scourge of the Throne',
    board({ you: { bf: ['Territorial Hellkite'] } }),
    'Run 4, two players',
  ),
  preset(
    'Territorial Hellkite, Scourge of the Throne',
    board({ you: { bf: ['Territorial Hellkite'] }, opp: [{ bf: ['Propaganda'] }, {}] }),
    "Run 5, Bob's Propaganda",
  ),
  preset(
    'Opportunistic Dragon',
    board({
      you: { bf: ['Mountain*4', 'Plains'], hand: ['Opportunistic Dragon', 'Cloudshift'] },
      opp: { human: true, bf: ['Syr Konrad, the Grim', 'Sol Ring', 'Swamp*2', 'Mountain*2'], hand: ['Murder', 'Act of Treason'] },
    }),
  ),
  preset(
    "Chandra's Ignition, Arachnogenesis",
    board({
      you: { bf: ['Vampire Nighthawk', 'Grizzly Bears', 'Mountain*5'], hand: ["Chandra's Ignition"] },
      opp: [{ life: 20, bf: ['Serra Angel', 'Craw Wurm'], hand: ['Murder'] }, { life: 20, bf: ['Hill Giant'] }],
    }),
    "Chandra's Ignition",
  ),
  preset(
    "Chandra's Ignition, Arachnogenesis",
    board({
      you: { bf: ['Forest*3'], hand: ['Arachnogenesis'] },
      opp: [{ human: true, bf: ['Grizzly Bears', 'Hill Giant'] }, { bf: ['Craw Wurm'] }],
      turn: 0,
      step: 'begin-combat',
    }),
    "Arachnogenesis, Bob's beginning of combat: Sit at Bob and attack you",
  ),
  preset(
    'Baloth Prime, Pugnacious Hammerskull, Junk Winder',
    board({
      you: {
        bf: ['Pugnacious Hammerskull', 'Junk Winder', 'Forest*6', 'Plains*2'],
        hand: ['Baloth Prime', 'Ancient Brontodon', 'Raise the Alarm'],
      },
      opp: { bf: ['Grizzly Bears', 'Hill Giant', 'Serra Angel'] },
    }),
  ),
  preset(
    'Neriv, Crackling Vanguard',
    board({
      you: {
        bf: [
          { name: 'Neriv, Crackling Vanguard', commander: true },
          'Goblin Token*2',
          'Treasure Token',
          '4/4 Angel Token', '4/4 Vigilant Angel Token',
          'Mountain*3',
        ],
      },
      opp: { bf: ['Food Token'] },
    }),
    'Run 1, Neriv your commander',
  ),
  preset(
    'Neriv, Crackling Vanguard',
    board({
      you: { bf: ['Neriv, Crackling Vanguard', { name: 'Krenko, Mob Boss', commander: true }, 'Goblin Token*2', 'Treasure Token', 'Mountain*3'] },
    }),
    'Run 2, Neriv in the 99',
  ),
  preset(
    'Living Death',
    board({
      you: { bf: ['Swamp*5', 'Hill Giant'], hand: ['Living Death'], gy: ['Grizzly Bears'] },
      opp: { bf: ['Serra Angel'], gy: ['Craw Wurm', 'Island'] },
    }),
    'Run 1',
  ),
  preset(
    'Living Death',
    board({
      you: { bf: ['Swamp*5', 'Hill Giant'], hand: ['Living Death'], gy: ['Grizzly Bears'] },
      opp: { bf: ['Serra Angel', 'Rest in Peace'], gy: ['Craw Wurm', 'Island'] },
    }),
    'Run 2, Rest in Peace',
  ),

  // --- Exiling from the top of a library ------------------------------------
  preset(
    'Reckless Impulse, Bloodbraid Elf, Ulamog, the Ceaseless Hunger, Pako, Arcane Retriever',
    board({
      you: {
        bf: ['Mystic Forge', 'Ulamog, the Ceaseless Hunger', 'Pako, Arcane Retriever', 'Mountain*8', 'Forest*4', 'Island*3'],
        hand: ['Reckless Impulse', 'Bloodbraid Elf', 'Outrageous Robbery', 'Watcher for Tomorrow'],
        lib: ['Forest', 'Mountain', 'Island', 'Plains', 'Divination'],
      },
    }),
    'the EXILE dev room, as a scenario',
  ),
  // --- Token stacks folding back --------------------------------------------
  preset(
    "Tribute to the World Tree, Secure the Wastes, Thalisse, Reverent Medium, Simic Ascendancy, Basri's Solidarity",
    board({
      you: {
        bf: ['Warrior Token*10', 'Tribute to the World Tree', 'Thalisse, Reverent Medium', 'Simic Ascendancy', 'Plains*8', 'Forest*4', 'Island*2'],
        hand: ['Secure the Wastes', "Basri's Solidarity"],
      },
    }),
  ),
  // --- Choices on resolution: populate, amass, sacrifice-then ---------------
  preset(
    "Trostani, Selesnya's Voice",
    board({
      you: { bf: ["Trostani, Selesnya's Voice", 'Elephant Token', 'Soldier Token', 'Forest*2', 'Plains*2'], hand: ['Grizzly Bears'] },
      opp: { bf: ['Goblin Token'] },
    }),
  ),
  preset(
    'Saruman, the White Hand, Changeling Outcast',
    board({
      you: {
        bf: ['Saruman, the White Hand', { name: 'Army Token', counters: { '+1/+1': 1 } }, 'Changeling Outcast', 'Island*3'],
        hand: ['Divination', 'Grizzly Bears'],
      },
    }),
  ),
  preset(
    'Wick, the Whorled Mind',
    board({
      you: {
        bf: ['Wick, the Whorled Mind', 'Snail Token', { name: 'Snail Token', counters: { '+1/+1': 1 } }, 'Island', 'Swamp*2', 'Mountain'],
        hand: ['Muck Rats'],
      },
    }),
  ),
  preset(
    'Breena, the Demagogue',
    board({
      you: { bf: ['Breena, the Demagogue', 'Hill Giant'] },
      opp: [{ human: true, life: 10, bf: ['Grizzly Bears'] }, { life: 20 }],
      turn: 0,
    }),
    "Bob's turn: Sit at Bob and attack Carol",
  ),
  preset(
    "Abdel Adrian, Gorion's Ward",
    board({ you: { bf: ['Sol Ring', 'Grizzly Bears', 'Plains*5', 'Swamp'], hand: ["Abdel Adrian, Gorion's Ward", 'Doom Blade'] } }),
  ),
  preset(
    'Ziatora, the Incinerator, Felothar, Dawn of the Abzan',
    board({
      you: { bf: ['Ziatora, the Incinerator', { name: 'Grizzly Bears', counters: { '+1/+1': 3 } }] },
      step: 'postcombat-main',
    }),
    'Ziatora: pass to your end step',
  ),
  preset(
    'Ziatora, the Incinerator, Felothar, Dawn of the Abzan',
    board({ you: { bf: ['Sol Ring', 'Grizzly Bears', 'Plains*2', 'Swamp*2', 'Forest*2'], hand: ['Felothar, Dawn of the Abzan'] } }),
    'Felothar',
  ),
  preset(
    "Caesar, Legion's Emperor",
    board({ you: { bf: ["Caesar, Legion's Emperor", 'Grizzly Bears', 'Mountain*5'] } }),
    'two players',
  ),
  preset(
    "Caesar, Legion's Emperor",
    board({ you: { bf: ["Caesar, Legion's Emperor", 'Grizzly Bears', 'Mountain*5'] }, opp: [{}, {}] }),
    'three players',
  ),
  preset(
    'Iron Man, Titan of Innovation',
    board({ you: { bf: ['Iron Man, Titan of Innovation', 'Sol Ring'], lib: ['Grizzly Bears', 'Mind Stone', 'Forest'] } }),
  ),
  preset(
    'Eddie Brock, Venom, Lethal Protector',
    board({
      you: { bf: ['Swamp*2', 'Mountain*2', 'Forest*2'], hand: ['Eddie Brock', 'Grizzly Bears', 'Craw Wurm'], gy: ['Llanowar Elves', 'Hill Giant'] },
    }),
  ),
  preset(
    'Yuma, Proud Protector',
    board({ you: { bf: ['Desert of the True', 'Forest*2', 'Plains*2'], hand: ['Yuma, Proud Protector'], gy: ['Forest', 'Plains', 'Island'] } }),
  ),
  // --- Free casts: cascade and suspend cast whole ---------------------------
  preset(
    "Bloodbraid Elf, Kolaghan's Command, Orim's Chant",
    board({
      you: { bf: ['Mountain*2', 'Forest*2', 'Swamp'], hand: ['Bloodbraid Elf'], lib: ["Kolaghan's Command"] },
      opp: { bf: ['Sol Ring', 'Grizzly Bears'], hand: ['Lightning Bolt'] },
    }),
    "Kolaghan's Command on top",
  ),
  preset(
    "Bloodbraid Elf, Kolaghan's Command, Orim's Chant",
    board({ you: { bf: ['Mountain*2', 'Forest*2', 'Plains'], hand: ['Bloodbraid Elf'], lib: ["Orim's Chant"] } }),
    "Orim's Chant on top, a Plains for its kicker",
  ),
  preset(
    'Rift Bolt (suspend)',
    board({ you: { bf: ['Mountain*2'], hand: ['Rift Bolt'] }, opp: { bf: ['Grizzly Bears'] } }),
    'suspend it from hand first (a scenario has no suspended cards)',
  ),
  preset(
    'Maelstrom Wanderer, The First Sliver, Imoti, Celebrant of Bounty, Zhulodok, Void Gorger',
    board({
      you: { bf: ['Forest*3', 'Island*3', 'Mountain*3'], hand: ['Maelstrom Wanderer'], lib: ['Opt', 'Lightning Bolt', 'Grizzly Bears'] },
    }),
    'Maelstrom Wanderer',
  ),
  preset(
    'Maelstrom Wanderer, The First Sliver, Imoti, Celebrant of Bounty, Zhulodok, Void Gorger',
    board({ you: { bf: ['The First Sliver', 'Swamp*2', 'Mountain*2', 'Forest*2', 'Island*2', 'Plains*2'], hand: ['Metallic Sliver', 'Grizzly Bears'] } }),
    'The First Sliver',
  ),
  preset(
    'Maelstrom Wanderer, The First Sliver, Imoti, Celebrant of Bounty, Zhulodok, Void Gorger',
    board({ you: { bf: ['Imoti, Celebrant of Bounty', 'Forest*4', 'Island*4'], hand: ['Craw Wurm', 'Shivan Dragon'] } }),
    'Imoti',
  ),
  preset(
    'Maelstrom Wanderer, The First Sliver, Imoti, Celebrant of Bounty, Zhulodok, Void Gorger',
    board({ you: { bf: ['Zhulodok, Void Gorger', 'Wastes*10'], hand: ['Ulamog, the Ceaseless Hunger'] } }),
    'Zhulodok',
  ),
  preset(
    'Yidris, Maelstrom Wielder',
    board({
      you: { bf: ['Yidris, Maelstrom Wielder', 'Island*2', 'Mountain*2', 'Swamp*2', 'Forest*2'], hand: ['Lightning Bolt', 'Grizzly Bears', 'Opt'] },
    }),
  ),
  preset(
    'Jodah, the Unifier',
    board({
      you: {
        bf: ['Jodah, the Unifier', 'Plains*2', 'Island*2', 'Swamp*2', 'Mountain*2', 'Forest*2'],
        hand: ['Krenko, Mob Boss', 'Grizzly Bears'],
        lib: ['Forest', 'Mountain', 'Grizzly Bears', 'Teysa Karlov', 'Island'],
      },
    }),
  ),
  // --- Harmonize and blitz ----------------------------------------------------
  preset(
    "Zenith Festival, Nature's Rhythm",
    board({
      you: { bf: ['Mountain*3', 'Hill Giant', { name: 'Craw Wurm', tapped: true }], gy: ['Zenith Festival'] },
      opp: { bf: ['Plains'] },
    }),
    'Zenith Festival (the HARMN dev room)',
  ),
  preset(
    "Zenith Festival, Nature's Rhythm",
    board({ you: { bf: ['Forest*7', 'Hill Giant'], gy: ["Nature's Rhythm"], lib: ['Craw Wurm', 'Grizzly Bears'] } }),
    "Nature's Rhythm",
  ),
  preset(
    'Star Athlete',
    board({ you: { bf: ['Mountain*4'], hand: ['Star Athlete'] }, opp: { human: true, bf: ['Hill Giant'] } }),
  ),
  preset(
    'Jaxis, the Troublemaker',
    board({ you: { bf: ['Jaxis, the Troublemaker', 'Hill Giant', 'Mountain'], hand: ['Forest'] } }),
    'on the battlefield',
  ),
  preset(
    'Jaxis, the Troublemaker',
    board({ you: { cmd: ['Jaxis, the Troublemaker'], bf: ['Mountain*4'] } }),
    'your commander, to blitz from the command zone',
  ),
  preset(
    'Henzie "Toolbox" Torre',
    board({
      you: { cmd: ['Krenko, Mob Boss'], bf: ['Henzie "Toolbox" Torre', 'Forest*4', 'Mountain*4', 'Swamp*2'], hand: ['Craw Wurm', 'Grizzly Bears'] },
    }),
    'cast Krenko from the command zone to see the discount',
  ),
  preset(
    'Curse of Opulence, Curse of Verbosity, Curse of Bounty, Curse of Disturbance',
    board({
      you: { bf: ['Mountain', 'Island*3', 'Forest*2', 'Swamp*3'], hand: ['Curse of Opulence', 'Curse of Verbosity', 'Curse of Bounty', 'Curse of Disturbance'] },
      opp: [{ human: true, bf: ['Grizzly Bears*2', 'Mind Stone'] }, { bf: ['Ajani, Caller of the Pride'] }],
    }),
  ),
  preset(
    "Trespasser's Curse",
    board({
      you: { bf: ['Swamp*2'], hand: ["Trespasser's Curse"] },
      opp: { human: true, bf: ['Forest*2'], hand: ['Grizzly Bears'] },
    }),
  ),
  preset(
    'Transforming Flourish, Creative Technique, Incarnation Technique, Replication Technique',
    board({
      you: { bf: ['Mountain*3', 'Runeclaw Bear'], hand: ['Transforming Flourish'], lib: ['Forest', 'Hill Giant'] },
      opp: [{ human: true, bf: ['Grizzly Bears'], lib: ['Forest', 'Lightning Bolt'] }, { bf: ['Hill Giant'], lib: ['Swamp', 'Grizzly Bears'] }],
    }),
  ),
  preset(
    'Archon of Falling Stars returning a Curse',
    board({
      you: { bf: ['Archon of Falling Stars', 'Swamp*3'], hand: ['Murder'], gy: ['Curse of Verbosity'] },
    }),
  ),
  preset(
    'Slaughter the Strong',
    board({
      you: { bf: ['Plains*3', 'Hill Giant', 'Grizzly Bears', 'Llanowar Elves'], hand: ['Slaughter the Strong'] },
      opp: [{ human: true, bf: ['Serra Angel', 'Craw Wurm'] }, { bf: ['Shivan Dragon', 'Grizzly Bears*2'] }],
    }),
  ),
  preset(
    'Shadrix Silverquill',
    board({
      you: { bf: ['Shadrix Silverquill', 'Grizzly Bears'] },
      opp: { bf: ['Hill Giant'] },
    }),
  ),
  preset(
    'Leyline Tyrant',
    board({
      you: { bf: ['Leyline Tyrant', 'Mountain*4', 'Forest*2', 'Swamp'], hand: ['Murder'] },
      opp: { life: 20 },
    }),
  ),
  preset(
    'Life from the Loam',
    board({
      you: { bf: ['Island*3'], hand: ['Divination'], gy: ['Life from the Loam'] },
    }),
  ),
  preset(
    'Reality Shift',
    board({
      you: { bf: ['Island*2', 'Forest*2', 'Grizzly Bears'], hand: ['Reality Shift'], lib: ['Serra Angel'] },
      opp: { human: true, bf: ['Grizzly Bears', 'Forest*2'], lib: ['Elvish Visionary'] },
    }),
  ),
  preset(
    'Deadpool, Trading Card',
    board({
      you: { bf: ['Swamp*2', 'Mountain*2', 'Soul Warden'], hand: ['Deadpool, Trading Card'] },
      opp: { bf: ['Serra Angel', 'Grizzly Bears', 'Island*3'] },
    }),
  ),
]

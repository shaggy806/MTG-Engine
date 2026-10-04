import { defineCard } from "../define.js";

// EDHREC rank 4868.
//
// Rulings:
//   [2020-08-07] This effect takes into account spells that were cast earlier in the turn before
//     Maelstrom Nexus entered the battlefield, including any spells still on the stack. If you've
//     already cast any spells that turn (including Maelstrom Nexus itself), this ability won't
//     give any of your spells cascade that turn.
//   [2020-08-07] If the first spell you cast in a turn already has cascade, both cascade abilities
//     will trigger separately.
//
// The First Sliver's granted cascade, narrowed by Anhelo, the Painter's
// `firstEachTurn` (which reads `spellsCastThisTurnAs`, so spells cast before
// the Nexus arrived count — the first ruling).

const CASCADE = {
  trigger: { on: "this-cast" },
  targets: [],
  effect: { kind: "cascade" },
  resolve: null,
  text: "Cascade",
} as const;

const TEXT =
  "The first spell you cast each turn has cascade. (When you cast your first spell, exile cards from the top of your library until you exile a nonland card that costs less. You may cast it without paying its mana cost. Put the exiled cards on the bottom in a random order.)";

export default defineCard({
  name: "Maelstrom Nexus",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { firstEachTurn: true, triggered: [CASCADE] },
      text: "The first spell you cast each turn has cascade.",
    },
  ],
});

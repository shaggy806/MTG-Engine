import { defineCard } from "../define.js";
import { transmute } from "../helpers.js";

// EDHREC rank 5443. The sacrificed creature may be this one (rule 118.3 asks
// only that it be a creature you control) — legal, and useless.
const REGENERATE = "Sacrifice a creature: Regenerate this creature.";
const TRANSMUTE_TEXT =
  "Transmute {1}{B}{B} ({1}{B}{B}, Discard this card: Search your library for a card with the same mana value as this card, reveal it, put it into your hand, then shuffle. Transmute only as a sorcery.)";

export default defineCard({
  name: "Dimir House Guard",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Skeleton"],
  power: 2,
  toughness: 3,
  keywords: ["fear"],
  text: `Fear (This creature can't be blocked except by artifact creatures and/or black creatures.)\n${REGENERATE}\n${TRANSMUTE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "creature" } } },
      targets: [],
      effect: { kind: "regenerate", target: "source" },
      resolve: null,
      text: REGENERATE,
    },
    transmute("{1}{B}{B}", 4, TRANSMUTE_TEXT),
  ],
});

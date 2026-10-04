import { defineCard } from "../define.js";

// EDHREC rank 6057.
//
// Transmute (rule 702.53a) is an activated ability from the hand — Channel's
// `zone: "hand"` shape, which discards the card as part of the cost — usable
// only as a sorcery (Ghost-Lit Stalker's `sorcerySpeed` channel). "The same
// mana value as this card" is this card's printed mana value, 1: it's
// activated only from the hand, where nothing changes it.
const TRANSMUTE_TEXT =
  "Transmute {1}{U}{U} ({1}{U}{U}, Discard this card: Search your library for a card with the same mana value as this card, reveal it, put it into your hand, then shuffle. Transmute only as a sorcery.)";

export default defineCard({
  name: "Dizzy Spell",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: `Target creature gets -3/-0 until end of turn.\n${TRANSMUTE_TEXT}`,
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -3, toughness: 0, duration: "end-of-turn" },
  activated: [
    {
      cost: { mana: "{1}{U}{U}", tap: false },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { manaValue: { op: "eq", n: 1 } },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      zone: "hand",
      sorcerySpeed: true,
      text: TRANSMUTE_TEXT,
    },
  ],
});

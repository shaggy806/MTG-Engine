import { defineCard } from "../define.js";

// EDHREC rank 5483.
// Makes Drone → new token "Drone Token" (scaffolded).
//
// Rulings:
//   [2025-07-25] Pinnacle Emissary’s first ability resolves before the spell that caused it to
//     trigger. It resolves even if that spell is countered or otherwise leaves the stack without
//     resolving.

const CAST_TEXT =
  'Whenever you cast an artifact spell, create a 1/1 colorless Drone artifact creature token with flying and "This token can block only creatures with flying."';

export default defineCard({
  name: "Pinnacle Emissary",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["artifact", "creature"],
  subtypes: ["Robot"],
  power: 3,
  toughness: 3,
  text:
    `${CAST_TEXT}\n` +
    "Warp {U/R} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  warp: { cost: "{U/R}" },
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "create-token", token: "Drone Token", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});

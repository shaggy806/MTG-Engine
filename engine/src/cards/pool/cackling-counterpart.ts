import { defineCard } from "../define.js";

// EDHREC rank 2894.
//
// Rulings:
//   [2025-01-24] The token copies exactly what was printed on the original creature and nothing
//     else (unless that creature is copying something else or is a token).
//   [2025-01-24] If the copied creature has {X} in its mana cost, X is considered to be 0.

export default defineCard({
  name: "Cackling Counterpart",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  flashback: { cost: "{5}{U}{U}" },
  text: "Create a token that's a copy of target creature you control.\nFlashback {5}{U}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["creature-you-control"],
  effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
});

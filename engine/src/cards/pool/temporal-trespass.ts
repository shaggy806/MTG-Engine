import { defineCard } from "../define.js";

// EDHREC rank 3045.
//
// Delve doesn't change the mana value, and only pays generic mana (the
// rulings) — `delve`'s own behaviour. "Exile Temporal Trespass" is
// `exileOnResolve` (Rise of the Eldrazi's shape).
export default defineCard({
  name: "Temporal Trespass",
  manaCost: "{8}{U}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Delve (Each card you exile from your graveyard while casting this spell pays for {1}.)\nTake an extra turn after this one. Exile Temporal Trespass.",
  delve: true,
  exileOnResolve: true,
  effect: { kind: "take-extra-turn" },
});

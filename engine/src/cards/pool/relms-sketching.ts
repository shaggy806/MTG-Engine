import { defineCard } from "../define.js";

// EDHREC rank 3978.
//
// Rulings:
//   [2025-06-06] If the copied permanent is copying something else, then the token enters as
//     whatever that permanent copied.
//   [2025-06-06] The token copies exactly what was printed on the original permanent (unless that
//     permanent is copying something else or is a token; see below). It doesn't copy whether that
//     permanent is tapped or untapped, whether it has any counters on it or any Auras or Equipment
//     attached to it, or any non-copy effects that have changed its types, color, power and
//     toughness, and so on.
//   [2025-06-06] If the permanent copied by the token had any "when [this permanent] enters"
//     abilities, the token also has those abilities, and they'll trigger when it's created.
//     Similarly, any "as [this permanent] enters" or "[this permanent] enters with" abilities that
//     the token has copied will also work.
//   [2025-06-06] If the copied permanent has {X} in its mana cost, X is 0.
//   [2025-06-06] If the copied permanent is a token, the new token that's created copies the
//     original characteristics of that token as stated by the effect that created the token.

export default defineCard({
  name: "Relm's Sketching",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Create a token that's a copy of target artifact, creature, or land.",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "creature", "land"] } }],
  effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
});

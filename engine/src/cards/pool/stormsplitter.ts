import { defineCard } from "../define.js";

// EDHREC rank 4197.
//
// Rulings:
//   [2024-07-26] If Stormsplitter splits… er, leaves the battlefield before its triggered ability
//     resolves, the token will still enter as a copy of Stormsplitter, using Stormsplitter’s
//     copiable values from when it was last on the battlefield.
//   [2024-07-26] In the unusual case where Stormsplitter becomes a copy of something else while
//     its triggered ability is on the stack but before it resolves, the token will enter as a copy
//     of whatever Stormsplitter is copying.
//   [2024-07-26] The token doesn’t copy whether Stormsplitter is tapped or untapped, whether it
//     has any counters on it or Auras and Equipment attached to it, or any non-copy effects that
//     have changed its power, toughness, types, color, and so on.
//   [2024-07-26] The token copy will have Stormsplitter’s abilities and will be able to create
//     copies of itself.

const TEXT =
  "Whenever you cast an instant or sorcery spell, create a token that's a copy of this creature. Exile that token at the beginning of the next end step.";

export default defineCard({
  name: "Stormsplitter",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 1,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 1, exileAtEndStep: true },
      resolve: null,
      text: TEXT,
    },
  ],
});

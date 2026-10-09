import { defineCard } from "../define.js";

// EDHREC rank 6554.
//
// Rulings:
//   [2024-04-12] The token copies exactly what was printed on the original artifact and nothing
//     else (unless that artifact was copying something else or was a token; see below). It doesn’t
//     copy whether that artifact was tapped or untapped, whether it had any counters on it or
//     Auras and Equipment attached to it, or any non-copy effects that changed its power,
//     toughness, types, color, and so on.
//   [2024-04-12] If the copied artifact was copying something else when it was last on the
//     battlefield, then the token enters the battlefield as whatever that artifact copied.
//   [2024-04-12] If the copied artifact was a token, the token that’s created copies the original
//     characteristics of that token as stated by the effect that created that token.
//
// - "This artifact or another artifact": a sacrifice trigger sees its own
//   source sacrificed (rule 603.10a), so one `sacrifice` trigger covers both.
// - "That artifact" is the delayed ability's trigger object, carried from the
//   creating one, and copied as it last existed on the battlefield (rule
//   608.2h) — copiable values only (rule 707.2), so not its counters.
const TEXT =
  "Whenever you sacrifice this artifact or another artifact, you may pay {2}. If you do, at the beginning of the next end step, create a token that's a copy of that artifact.";

export default defineCard({
  name: "Esoteric Duplicator",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  subtypes: ["Clue"],
  text: `${TEXT}\n{2}, Sacrifice this artifact: Draw a card.`,
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {2} to copy that artifact at the beginning of the next end step?",
        cost: "{2}",
        effect: {
          kind: "delayed-trigger",
          at: "next-end-step",
          effect: { kind: "create-token-copy", of: "trigger-object", count: 1, who: "you" },
          text: "At the beginning of the next end step, create a token that's a copy of that artifact.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice this artifact: Draw a card.",
    },
  ],
});

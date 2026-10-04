import { defineCard } from "../define.js";

// EDHREC rank 4535.
//
// Rulings:
//   [2023-10-13] If the copied token is copying something else (for example, if the copied token
//     is one previously created by this ability), then the token enters the battlefield as
//     whatever that token copied.
//   [2023-10-13] The token you create copies the original characteristics of the token as stated
//     by the effect that created that token, (unless that token is copying something else). It
//     doesn't copy whether that token is tapped or untapped, whether it has any counters on it or
//     Auras and Equipment attached to it, or any non-copy effects.
//   [2023-10-13] Any enters-the-battlefield abilities of the copied token will trigger when the
//     token enters the battlefield.

const COPY_TEXT = "II, III, IV, V, VI — Create a token that's a copy of target non-Saga token you control.";

export default defineCard({
  name: "City of Death",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after VI.)\nI — Create a Treasure token.\n${COPY_TEXT}`,
  chapters: [
    {
      at: [1],
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "I — Create a Treasure token.",
    },
    {
      at: [2, 3, 4, 5, 6],
      targets: [{ kind: "permanent", whose: "you", filter: { token: true, notSubtypes: ["Saga"] } }],
      effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});

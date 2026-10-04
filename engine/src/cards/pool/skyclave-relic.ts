import { defineCard } from "../define.js";

// EDHREC rank 2517.
//
// Josu Vess's shape: the kicker rider is an enters trigger with a
// `self-kicked` intervening-if. The token copies weren't cast, so they aren't
// kicked and don't copy themselves again (the ruling). A Relic that has left
// before the trigger resolves is copied as it last existed (rule 608.2h).
//
// Rulings:
//   [2024-11-08] If you put a permanent with a kicker ability onto the battlefield without casting
//     it, you can't kick it.
//   [2024-11-08] If a card or token enters as a copy of a permanent, the new permanent isn't
//     kicked, even if the original was.

const COPY_TEXT =
  "When this artifact enters, if it was kicked, create two tapped tokens that are copies of this artifact.";

export default defineCard({
  name: "Skyclave Relic",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  keywords: ["indestructible"],
  text: `Kicker {3}\nIndestructible\n${COPY_TEXT}\n{T}: Add one mana of any color.`,
  kicker: { cost: "{3}" },
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      condition: { kind: "self-kicked" },
      targets: [],
      effect: { kind: "create-token-copy", of: "source", count: 2, tapped: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});

import { defineCard } from "../define.js";

// EDHREC rank 5968.
//
// Rulings:
//   [2023-04-14] If either target is an illegal target as Cosmic Hunger tries to resolve, the
//     creature you control won’t deal damage.
//
// Bite Down's one-sided fight, the second target "another" than the first
// (Ulvenwald Tracker) and anyone's.
export default defineCard({
  name: "Cosmic Hunger",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature you control deals damage equal to its power to another target creature, planeswalker, or battle.",
  targets: [
    "creature-you-control",
    {
      kind: "other",
      of: { kind: "permanent", filter: { typesAnyOf: ["creature", "planeswalker", "battle"] } },
      than: { slot: 0 },
    },
  ],
  effect: { kind: "fight", a: 0, b: 1, oneSided: true },
});

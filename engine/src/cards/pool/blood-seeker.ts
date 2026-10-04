import { defineCard } from "../define.js";

// EDHREC rank 2610.
//
// Rulings:
//   [2011-09-22] Life loss is not the same as damage. Blood Seeker's ability will not cause
//     creatures with bloodthirst to enter with +1/+1 counters.

const TEXT = "Whenever a creature an opponent controls enters, you may have that player lose 1 life.";

export default defineCard({
  name: "Blood Seeker",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Shaman"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      // Suture Priest's second ability: "that player" is the entering
      // creature's controller.
      trigger: { on: "enters-battlefield", who: "opponent", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Have that player lose 1 life?",
        effect: { kind: "lose-life", amount: 1, who: "trigger-controller" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});

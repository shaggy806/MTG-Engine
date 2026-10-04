import { defineCard } from "../define.js";

// EDHREC rank 3179.
//
// Rulings:
//   [2023-10-13] If a spell or ability allows you to copy a spell on the stack but doesn't specify
//     that the spell is cast, that spell wasn't cast and won't be counted by paradox abilities.
//   [2023-10-13] Paradox abilities count any spells cast from zones other than your hand. These
//     are usually spells cast from exile, the graveyard, or the command zone.

const PARADOX_TEXT =
  "Paradox — Whenever you cast a spell from anywhere other than your hand, this creature deals 3 damage to any target. Then put a +1/+1 counter on this creature.";
const DIES_TEXT = "When this creature dies, it deals damage equal to its power to each opponent.";

export default defineCard({
  name: "Flaming Tyrannosaurus",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 5,
  toughness: 5,
  keywords: ["menace"],
  text: `Menace\n${PARADOX_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", notFrom: "hand" },
      targets: ["any-target"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 3, target: 0 },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: PARADOX_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      // The power it died with (last-known information).
      effect: { kind: "damage", amount: { powerOf: "source" }, who: "each-opponent" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});

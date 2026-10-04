import { defineCard } from "../define.js";

// EDHREC rank 3578.
//
// Rulings:
//   [2024-11-08] Kiora's threshold ability checks your graveyard at the moment it would trigger to
//     see if you have seven or more cards in your graveyard. If you don't, the ability won't
//     trigger at all. If it does trigger, the ability will check again as it tries to resolve. If
//     you don't have seven or more cards in your graveyard at that time, the ability won't resolve
//     and none of its effects will happen.

const ETB_TEXT = "When Kiora enters, draw two cards, then discard two cards.";
const ATTACK_TEXT =
  "Threshold — Whenever Kiora attacks, if there are seven or more cards in your graveyard, you may create Scion of the Deep, a legendary 8/8 blue Octopus creature token.";

export default defineCard({
  name: "Kiora, the Rising Tide",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Noble"],
  power: 3,
  toughness: 2,
  text: `${ETB_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 2 }],
      },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      // Intervening "if" (rule 603.4): asked as it triggers and again as it
      // resolves (the ruling).
      condition: { kind: "threshold" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create Scion of the Deep?",
        effect: { kind: "create-token", token: "Scion of the Deep", count: 1 },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});

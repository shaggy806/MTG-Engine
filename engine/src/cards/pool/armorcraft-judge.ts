import { defineCard } from "../define.js";

// EDHREC rank 3598.
//
// Rulings:
//   [2020-11-10] Armorcraft Judge's ability counts the number of creatures, not the number of
//     counters. A creature with more than one +1/+1 counter won't cause you to draw more than one
//     card.
//   [2020-11-10] The number of creatures you control with +1/+1 counters on them is counted only
//     as Armorcraft Judge's triggered ability resolves. Players may respond to the triggered
//     ability by trying to change that number.

// Counts creatures, not counters, as the ability resolves (the rulings).
export default defineCard({
  name: "Armorcraft Judge",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Artificer"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, draw a card for each creature you control with a +1/+1 counter on it.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "draw",
        amount: {
          countOf: { type: "creature", controlledBy: "you", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
        },
      },
      resolve: null,
      text: "When this creature enters, draw a card for each creature you control with a +1/+1 counter on it.",
    },
  ],
});

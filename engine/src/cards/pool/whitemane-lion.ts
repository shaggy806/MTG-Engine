import { defineCard } from "../define.js";

// EDHREC rank 3808.
//
// Rulings:
//   [2022-12-08] Whitemane Lion's ability doesn't target any creature, therefore no player may
//     take actions between the time you choose the creature to return and the time you return it.
//   [2022-12-08] You may return Whitemane Lion itself to its owner's hand as its triggered ability
//     resolves. If you don't control any other creature, you must return it.
//
// Arid Archway's shape: a choice as it resolves, itself included.

const ETB = "When this creature enters, return a creature you control to its owner's hand.";

export default defineCard({
  name: "Whitemane Lion",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\n${ETB}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "choose-permanents",
        filter: { type: "creature", controlledBy: "you" },
        min: 1,
        upTo: 1,
        then: { kind: "return-to-hand", target: 0 },
        prompt: "Return a creature you control to its owner's hand",
      },
      resolve: null,
      text: ETB,
    },
  ],
});

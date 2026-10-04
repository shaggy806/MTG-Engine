import { defineCard } from "../define.js";

// EDHREC rank 4635.
//
// Rulings:
//   [2024-06-07] You may return Shrieking Drake itself to its owner's hand as its triggered
//     ability resolves. If you don't control any other creature, you must return it.
//   [2024-06-07] Shrieking Drake's ability doesn't target any creature. Therefore, no player may
//     take actions between the time you choose the creature to return and the time you return it.
//
// Whitemane Lion's shape: chosen as it resolves, untargeted, itself included.

const ETB = "When this creature enters, return a creature you control to its owner's hand.";

export default defineCard({
  name: "Shrieking Drake",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${ETB}`,
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

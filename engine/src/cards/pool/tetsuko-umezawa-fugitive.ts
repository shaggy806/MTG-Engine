import { defineCard } from "../define.js";

// Family Matters. "Can't be blocked" is a `cantBeBlockedBy` any creature,
// read as a block is checked (Delney's shape), so the "power or toughness 1
// or less" scope reads each creature's current P/T — which the layer fold
// couldn't ask of itself. Tetsuko is a 1/3, so she's one of them.
const TEXT = "Creatures you control with power or toughness 1 or less can't be blocked.";

export default defineCard({
  name: "Tetsuko Umezawa, Fugitive",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 1,
  toughness: 3,
  text: TEXT,
  static: [
    {
      affects: {
        scope: "filter",
        filter: {
          type: "creature",
          controlledBy: "you",
          anyOf: [{ power: { op: "lte", n: 1 } }, { toughness: { op: "lte", n: 1 } }],
        },
      },
      cantBeBlockedBy: {},
      text: TEXT,
    },
  ],
});

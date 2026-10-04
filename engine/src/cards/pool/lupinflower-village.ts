import { defineCard } from "../define.js";

// EDHREC rank 4859.

// Oakhollow Village's cycle.
const DIG_TEXT =
  "{1}{W}, {T}, Sacrifice this land: Look at the top six cards of your library. You may reveal a Bat, Bird, Mouse, or Rabbit card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Lupinflower Village",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n{T}: Add {W}. Spend this mana only to cast a creature spell.\n${DIG_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "W",
        amount: 1,
        spendOnly: { spell: { type: "creature" }, text: "Spend this mana only to cast a creature spell." },
      },
      resolve: null,
      text: "{T}: Add {W}. Spend this mana only to cast a creature spell.",
    },
    {
      cost: { mana: "{1}{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 6,
        reveal: "chosen",
        min: 0,
        max: 1,
        filter: { subtypes: ["Bat", "Bird", "Mouse", "Rabbit"] },
        destination: "hand",
        leftover: "bottom-random",
      },
      resolve: null,
      text: DIG_TEXT,
    },
  ],
});

import { defineCard } from "../define.js";

// EDHREC rank 4228.

const ENERGY_TEXT = "Whenever a creature you control enters, you get {E} (an energy counter).";
const BOUNCE_TEXT = "{4}, {T}: Return target creature you control to its owner's hand.";

export default defineCard({
  name: "Decoction Module",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: ENERGY_TEXT + "\n" + BOUNCE_TEXT,
  activated: [
    {
      cost: { mana: "{4}", tap: true },
      targets: ["creature-you-control"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: BOUNCE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "get-energy", amount: 1 },
      resolve: null,
      text: ENERGY_TEXT,
    },
  ],
});

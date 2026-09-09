import { defineCard } from "../define.js";

// Modern Horizons 3.
export default defineCard({
  name: "Combat Thresher",
  manaCost: "{6}",
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 4,
  toughness: 4,
  cycling: { cost: "{2}" },
  text: "Ward {2}\nWhen Combat Thresher enters the battlefield, draw a card.\nCycling {2}",
  static: [
    {
      affects: { scope: "self" },
      ward: { mana: "{2}" },
      text: "Ward {2}",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Combat Thresher enters the battlefield, draw a card.",
    },
  ],
});

import { defineCard } from "../define.js";

const FIRE_BREATH = "Fire Breath — When this creature enters, it deals 4 damage to each opponent.";

export default defineCard({
  name: "Red Dragon",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${FIRE_BREATH}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "damage", amount: 4, who: "each-opponent" },
      resolve: null,
      text: FIRE_BREATH,
    },
  ],
});

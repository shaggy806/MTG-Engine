import { defineCard } from "../define.js";

export default defineCard({
  name: "Daring Apprentice",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice this creature: Counter target spell.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: "{T}, Sacrifice this creature: Counter target spell.",
    },
  ],
});

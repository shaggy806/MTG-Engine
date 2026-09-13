import { defineCard } from "../define.js";

export default defineCard({
  name: "Fume Spitter",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 1,
  toughness: 1,
  text: "Sacrifice Fume Spitter: Put a -1/-1 counter on target creature.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
      resolve: null,
      text: "Sacrifice Fume Spitter: Put a -1/-1 counter on target creature.",
    },
  ],
});

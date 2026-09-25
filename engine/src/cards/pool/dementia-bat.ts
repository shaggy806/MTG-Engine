import { defineCard } from "../define.js";

export default defineCard({
  name: "Dementia Bat",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Bat"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{4}{B}, Sacrifice this creature: Target player discards two cards.",
  activated: [
    {
      cost: { mana: "{4}{B}", tap: false, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 2 },
      resolve: null,
      text: "{4}{B}, Sacrifice this creature: Target player discards two cards.",
    },
  ],
});

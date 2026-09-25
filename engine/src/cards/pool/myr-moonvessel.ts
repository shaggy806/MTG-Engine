import { defineCard } from "../define.js";

export default defineCard({
  name: "Myr Moonvessel",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, add {C}.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "When this creature dies, add {C}.",
    },
  ],
});

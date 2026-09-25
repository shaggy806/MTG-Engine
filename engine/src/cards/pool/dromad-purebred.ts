import { defineCard } from "../define.js";

export default defineCard({
  name: "Dromad Purebred",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Camel", "Beast"],
  power: 1,
  toughness: 5,
  text: "Whenever this creature is dealt damage, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever this creature is dealt damage, you gain 1 life.",
    },
  ],
});

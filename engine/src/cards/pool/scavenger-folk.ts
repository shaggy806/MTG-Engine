import { defineCard } from "../define.js";

export default defineCard({
  name: "Scavenger Folk",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
  text: "{G}, {T}, Sacrifice this creature: Destroy target artifact.",
  activated: [
    {
      cost: { mana: "{G}", tap: true, sacrifice: "self" },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{G}, {T}, Sacrifice this creature: Destroy target artifact.",
    },
  ],
});

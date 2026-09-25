import { defineCard } from "../define.js";

export default defineCard({
  name: "Uktabi Faerie",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Faerie"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\n{3}{G}, Sacrifice this creature: Destroy target artifact.",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false, sacrifice: "self" },
      targets: ["artifact"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{3}{G}, Sacrifice this creature: Destroy target artifact.",
    },
  ],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Sylvok Replica",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Shaman"],
  power: 1,
  toughness: 3,
  text: "{G}, Sacrifice this creature: Destroy target artifact or enchantment.",
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{G}, Sacrifice this creature: Destroy target artifact or enchantment.",
    },
  ],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Haywire Mite",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  text:
    "When this creature dies, you gain 2 life.\n" +
    "{G}, Sacrifice this creature: Exile target noncreature artifact or noncreature enchantment.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "When this creature dies, you gain 2 life.",
    },
  ],
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: "self" },
      targets: [
        {
          kind: "permanent",
          filter: { typesAnyOf: ["artifact", "enchantment"], notTypes: ["creature"] },
        },
      ],
      effect: { kind: "exile", target: 0 },
      resolve: null,
      text: "{G}, Sacrifice this creature: Exile target noncreature artifact or noncreature enchantment.",
    },
  ],
});

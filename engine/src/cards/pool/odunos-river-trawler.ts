import { defineCard } from "../define.js";

export default defineCard({
  name: "Odunos River Trawler",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, return target enchantment creature card from your graveyard to your hand.\n{W}, Sacrifice this creature: Return target enchantment creature card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{W}", tap: false, sacrifice: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { types: ["enchantment", "creature"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{W}, Sacrifice this creature: Return target enchantment creature card from your graveyard to your hand.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { types: ["enchantment", "creature"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target enchantment creature card from your graveyard to your hand.",
    },
  ],
});

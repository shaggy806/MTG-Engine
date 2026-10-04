import { defineCard } from "../define.js";

// EDHREC rank 3596.
// Makes Eldrazi Scion → use "Eldrazi Scion Token".

// Devoid: colorless despite its black mana cost (its identity is still black).
export default defineCard({
  name: "Sifter of Skulls",
  manaCost: "{3}{B}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 4,
  toughness: 3,
  text: "Devoid (This card has no color.)\nWhenever another nontoken creature you control dies, create a 1/1 colorless Eldrazi Scion creature token. It has \"Sacrifice this token: Add {C}.\" ({C} represents colorless mana.)",
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Scion Token", count: 1 },
      resolve: null,
      text: "Whenever another nontoken creature you control dies, create a 1/1 colorless Eldrazi Scion creature token. It has \"Sacrifice this token: Add {C}.\"",
    },
  ],
});

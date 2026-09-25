import { defineCard } from "../define.js";

export default defineCard({
  name: "Halo Scarab",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 1,
  text: "{2}, Exile this card from your graveyard: Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "{2}, Exile this card from your graveyard: Create a Treasure token.",
      zone: "graveyard",
    },
  ],
});

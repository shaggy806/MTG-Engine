import { defineCard } from "../define.js";

export default defineCard({
  name: "Suspicious Shambler",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 4,
  toughness: 2,
  text: "{4}{B}{B}, Exile this card from your graveyard: Create two 2/2 black Zombie creature tokens. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{4}{B}{B}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 2 },
      resolve: null,
      text: "{4}{B}{B}, Exile this card from your graveyard: Create two 2/2 black Zombie creature tokens. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});

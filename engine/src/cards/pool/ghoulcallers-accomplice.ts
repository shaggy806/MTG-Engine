import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghoulcaller's Accomplice",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 2,
  text: "{3}{B}, Exile this card from your graveyard: Create a 2/2 black Zombie creature token. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{3}{B}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: "{3}{B}, Exile this card from your graveyard: Create a 2/2 black Zombie creature token. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});

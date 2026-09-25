import { defineCard } from "../define.js";

export default defineCard({
  name: "Fairgrounds Patrol",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  text: "{1}{W}, Exile this card from your graveyard: Create a 1/1 colorless Thopter artifact creature token with flying. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: "{1}{W}, Exile this card from your graveyard: Create a 1/1 colorless Thopter artifact creature token with flying. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});

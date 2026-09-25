import { defineCard } from "../define.js";

export default defineCard({
  name: "Nearheath Chaplain",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 3,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink\n{2}{W}, Exile this card from your graveyard: Create two 1/1 white Spirit creature tokens with flying. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 2 },
      resolve: null,
      text: "{2}{W}, Exile this card from your graveyard: Create two 1/1 white Spirit creature tokens with flying. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});

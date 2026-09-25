import { defineCard } from "../define.js";

export default defineCard({
  name: "Stone Docent",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Chimera"],
  power: 3,
  toughness: 1,
  text: "{W}, Exile this card from your graveyard: You gain 2 life. Surveil 1. Activate only as a sorcery. (Look at the top card of your library. You may put it into your graveyard.)",
  activated: [
    {
      cost: { mana: "{W}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "gain-life", amount: 2 }, { kind: "surveil", amount: 1 }],
      },
      resolve: null,
      text: "{W}, Exile this card from your graveyard: You gain 2 life. Surveil 1. Activate only as a sorcery.",
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});

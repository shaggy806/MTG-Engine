import { defineCard } from "../define.js";

export default defineCard({
  name: "Survivor of Korlis",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\n{1}{W}, Exile this card from your graveyard: Scry 2.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "{1}{W}, Exile this card from your graveyard: Scry 2.",
      zone: "graveyard",
    },
  ],
});

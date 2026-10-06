import { defineCard } from "../define.js";

export default defineCard({
  name: "Allure of Power",
  art: "https://cards.scryfall.io/art_crop/back/1/5/15ae4d50-be2f-412c-bb6b-b0a06b60474a.jpg",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nDraw two cards. (Then exile this card. You may cast the artifact later from exile.)",
  additionalCost: { sacrifice: { type: "creature", controlledBy: "you" } },
  effect: { kind: "draw", amount: 2 },
  faces: ["My Precious", "Allure of Power"],
  adventure: true,
});

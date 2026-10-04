import { defineCard } from "../define.js";

export default defineCard({
  name: "Embereth Blaze",
  art: "https://cards.scryfall.io/art_crop/back/8/b/8b0e6daf-0dec-4718-af79-b7ce137c3135.jpg",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Embereth Blaze deals 2 damage to any target. (Then exile this card. You may cast the enchantment later from exile.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 2, target: 0 },
  faces: ["Virtue of Courage", "Embereth Blaze"],
  adventure: true,
});

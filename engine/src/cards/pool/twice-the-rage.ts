import { defineCard } from "../define.js";

export default defineCard({
  name: "Twice the Rage",
  art: "https://cards.scryfall.io/art_crop/back/7/0/70c12e75-7e65-4706-b976-e47835910928.jpg",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Target creature gains double strike until end of turn. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
  faces: ["Two-Headed Hunter", "Twice the Rage"],
  adventure: true,
});

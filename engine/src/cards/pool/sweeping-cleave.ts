import { defineCard } from "../define.js";

export default defineCard({
  name: "Sweeping Cleave",
  art: "https://cards.scryfall.io/art_crop/back/2/1/21e34888-f57c-4f5d-bb5c-b82be980d145.jpg",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Target creature you control gains double strike until end of turn. (Then exile this card. You may cast the artifact later from exile.)",
  targets: ["creature-you-control"],
  effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
  faces: ["Two-Handed Axe", "Sweeping Cleave"],
  adventure: true,
});

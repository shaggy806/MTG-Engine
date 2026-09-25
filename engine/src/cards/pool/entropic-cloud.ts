import { defineCard } from "../define.js";

export default defineCard({
  name: "Entropic Cloud",
  art: "https://cards.scryfall.io/art_crop/back/7/8/783adffd-449f-44a6-8faf-3e38a201b05b.jpg",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Creatures you control gain deathtouch until end of turn. (Then exile this card. You may cast the creature later from exile.)",
  effect: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword: "deathtouch",
    duration: "end-of-turn",
  },
  faces: ["Topaz Dragon", "Entropic Cloud"],
  adventure: true,
});

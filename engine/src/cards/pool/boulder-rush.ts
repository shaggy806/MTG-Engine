import { defineCard } from "../define.js";

export default defineCard({
  name: "Boulder Rush",
  art: "https://cards.scryfall.io/art_crop/back/a/3/a3d13d84-01e4-4429-93db-e5afff811527.jpg",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Target creature gets +2/+0 until end of turn. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
  faces: ["Rimrock Knight", "Boulder Rush"],
  adventure: true,
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Puny Snack",
  art: "https://cards.scryfall.io/art_crop/back/e/7/e77a8fd4-af5f-42b3-a87e-788baf2562dd.jpg",
  manaCost: "{2}{B}",
  colors: ["G"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Target creature gets -2/-2 until end of turn. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
  faces: ["Gingerbread Hunter", "Puny Snack"],
  adventure: true,
});

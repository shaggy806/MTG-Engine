import { defineCard } from "../define.js";

export default defineCard({
  name: "Shield's Might",
  art: "https://cards.scryfall.io/art_crop/back/1/9/194b7a1c-291a-470e-9a40-61b72a46793b.jpg",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Target creature gets +2/+2 until end of turn. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
  faces: ["Garenbrig Carver", "Shield's Might"],
  adventure: true,
});

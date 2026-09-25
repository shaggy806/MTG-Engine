import { defineCard } from "../define.js";

export default defineCard({
  name: "Spew Flame",
  art: "https://cards.scryfall.io/art_crop/back/4/1/419ca9e5-8413-4378-a4ef-eda5a1024218.jpg",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Spew Flame deals 5 damage to target creature. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "damage", amount: 5, target: 0 },
  faces: ["Smaug, the Great Calamity", "Spew Flame"],
  adventure: true,
});

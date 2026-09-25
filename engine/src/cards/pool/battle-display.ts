import { defineCard } from "../define.js";

export default defineCard({
  name: "Battle Display",
  art: "https://cards.scryfall.io/art_crop/back/e/2/e2f789b3-3274-4a93-b44b-fabc44c1833c.jpg",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Destroy target artifact. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["artifact"],
  effect: { kind: "destroy", target: 0 },
  faces: ["Embereth Shieldbreaker", "Battle Display"],
  adventure: true,
});

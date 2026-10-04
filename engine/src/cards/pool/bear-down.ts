import { defineCard } from "../define.js";

// Adventure half of Stormkeld Vanguard (EDHREC rank 6400).

export default defineCard({
  name: "Bear Down",
  art: "https://cards.scryfall.io/art_crop/back/b/a/bacb1fe5-0adf-461f-b698-9d09a8728c63.jpg",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Destroy target artifact or enchantment. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "destroy", target: 0 },
  faces: ["Stormkeld Vanguard", "Bear Down"],
  adventure: true,
});

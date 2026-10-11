import { defineCard } from "../define.js";

// The Adventure half of Scalding Viper (scalding-viper.ts): blue, by its own
// mana cost (AUTHORING.md §12).
export default defineCard({
  name: "Steam Clean",
  art: "58e72bfb-6f64-4647-afb6-b5ad4737121c",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Return target nonland permanent to its owner's hand. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["nonland-permanent"],
  effect: { kind: "return-to-hand", target: 0 },
  faces: ["Scalding Viper", "Steam Clean"],
  adventure: true,
});

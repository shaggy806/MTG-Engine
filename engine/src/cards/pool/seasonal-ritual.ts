import { defineCard } from "../define.js";

export default defineCard({
  name: "Seasonal Ritual",
  art: "https://cards.scryfall.io/art_crop/back/2/a/2a0d430f-da84-4752-940c-8457c525aac9.jpg",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Add one mana of any color. (Then exile this card. You may cast the creature later from exile.)",
  effect: {
    kind: "modal",
    minModes: 1,
    maxModes: 1,
    modes: [
      { text: "Add {W}.", effect: { kind: "add-mana", mana: "W", amount: 1 } },
      { text: "Add {U}.", effect: { kind: "add-mana", mana: "U", amount: 1 } },
      { text: "Add {B}.", effect: { kind: "add-mana", mana: "B", amount: 1 } },
      { text: "Add {R}.", effect: { kind: "add-mana", mana: "R", amount: 1 } },
      { text: "Add {G}.", effect: { kind: "add-mana", mana: "G", amount: 1 } },
    ],
  },
  faces: ["Rosethorn Acolyte", "Seasonal Ritual"],
  adventure: true,
});

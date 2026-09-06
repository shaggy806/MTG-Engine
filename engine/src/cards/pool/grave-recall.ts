import { defineCard } from "../define.js";

export default defineCard({
  name: "Grave Recall",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Look at your graveyard. You may put a card from it into your hand.",
  effect: {
    kind: "look-and-choose",
    zone: "graveyard",
    min: 0,
    max: 1,
    destination: "hand",
    leftover: "stay",
  },
});

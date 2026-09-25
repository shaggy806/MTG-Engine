import { defineCard } from "../define.js";

export default defineCard({
  name: "Boon of the Wish-Giver",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  cycling: { cost: "{1}" },
  text: "Draw four cards.\nCycling {1} ({1}, Discard this card: Draw a card.)",
  effect: { kind: "draw", amount: 4 },
});

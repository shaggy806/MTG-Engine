import { defineCard } from "../define.js";

export default defineCard({
  name: "Taigam's Scheming",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Surveil 5. (Look at the top five cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)",
  effect: { kind: "surveil", amount: 5 },
});

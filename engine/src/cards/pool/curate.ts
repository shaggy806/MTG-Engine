import { defineCard } from "../define.js";

export default defineCard({
  name: "Curate",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Surveil 2. (Look at the top two cards of your library, then put any number of them into your graveyard and the rest on top of your library in any order.)\nDraw a card.",
  effect: { kind: "sequence", effects: [{ kind: "surveil", amount: 2 }, { kind: "draw", amount: 1 }] },
});

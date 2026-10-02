import { defineCard } from "../define.js";

export default defineCard({
  name: "Treasure Cruise",
  manaCost: "{7}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Delve (Each card you exile from your graveyard while casting this spell pays for {1}.)\n" +
    "Draw three cards.",
  delve: true,
  effect: { kind: "draw", amount: 3 },
});

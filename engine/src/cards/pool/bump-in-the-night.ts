import { defineCard } from "../define.js";

export default defineCard({
  name: "Bump in the Night",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{5}{R}" },
  text: "Target opponent loses 3 life.\nFlashback {5}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["opponent"],
  effect: { kind: "lose-life", amount: 3, target: 0 },
});

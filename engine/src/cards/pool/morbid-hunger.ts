import { defineCard } from "../define.js";

export default defineCard({
  name: "Morbid Hunger",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{7}{B}{B}" },
  text: "Morbid Hunger deals 3 damage to any target. You gain 3 life.\nFlashback {7}{B}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 3, target: 0 }, { kind: "gain-life", amount: 3 }],
  },
});

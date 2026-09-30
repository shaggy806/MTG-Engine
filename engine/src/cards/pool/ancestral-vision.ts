import { defineCard } from "../define.js";

// No mana cost, so it can only be suspended (rule 118.6). Blue by its color
// indicator.
export default defineCard({
  name: "Ancestral Vision",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Suspend 4—{U} (Rather than cast this card from your hand, pay {U} and exile it with four time counters on it. At the beginning of your upkeep, remove a time counter. When the last is removed, you may cast it without paying its mana cost.)\n" +
    "Target player draws three cards.",
  suspend: { n: 4, cost: "{U}" },
  targets: ["player"],
  effect: { kind: "draw", amount: 3, target: 0 },
});

import { curseWhenAttacked } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Curse of Verbosity",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura", "Curse"],
  text: "Enchant player\nWhenever enchanted player is attacked, you draw a card. Each opponent attacking that player does the same.",
  targets: ["player"],
  triggered: [
    curseWhenAttacked(
      { kind: "draw", amount: 1, who: "you-and-opponents-attacking-trigger-player" },
      "Whenever enchanted player is attacked, you draw a card. Each opponent attacking that player does the same.",
    ),
  ],
});

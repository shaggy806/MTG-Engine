import { curseWhenAttacked } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Curse of Opulence",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura", "Curse"],
  text:
    "Enchant player\nWhenever enchanted player is attacked, create a Gold token. Each opponent attacking that " +
    "player does the same. (A Gold token is an artifact with \"Sacrifice this token: Add one mana of any color.\")",
  targets: ["player"],
  triggered: [
    curseWhenAttacked(
      { kind: "create-token", token: "Gold Token", count: 1, who: "you-and-opponents-attacking-trigger-player" },
      "Whenever enchanted player is attacked, create a Gold token. Each opponent attacking that player does the same.",
    ),
  ],
});

import { curseWhenAttacked } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Curse of Disturbance",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Aura", "Curse"],
  text:
    "Enchant player\nWhenever enchanted player is attacked, create a 2/2 black Zombie creature token. Each " +
    "opponent attacking that player does the same.",
  targets: ["player"],
  triggered: [
    curseWhenAttacked(
      { kind: "create-token", token: "Zombie Token", count: 1, who: "you-and-opponents-attacking-trigger-player" },
      "Whenever enchanted player is attacked, create a 2/2 black Zombie creature token. Each opponent attacking that player does the same.",
    ),
  ],
});

import { curseWhenAttacked } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Curse of Bounty",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura", "Curse"],
  text:
    "Enchant player\nWhenever enchanted player is attacked, untap all nonland permanents you control. Each " +
    "opponent attacking that player untaps all nonland permanents they control.",
  targets: ["player"],
  triggered: [
    curseWhenAttacked(
      {
        kind: "untap-all",
        filter: { notTypes: ["land"], controlledBy: "you" },
        who: "you-and-opponents-attacking-trigger-player",
      },
      "Whenever enchanted player is attacked, untap all nonland permanents you control. Each opponent attacking that player untaps all nonland permanents they control.",
    ),
  ],
});

import { defineCard } from "../define.js";

export default defineCard({
  name: "Need for Speed",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Sacrifice a land: Target creature gains haste until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a land: Target creature gains haste until end of turn.",
    },
  ],
});

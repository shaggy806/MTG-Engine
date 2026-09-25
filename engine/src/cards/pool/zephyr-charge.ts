import { defineCard } from "../define.js";

export default defineCard({
  name: "Zephyr Charge",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "{1}{U}: Target creature gains flying until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{U}: Target creature gains flying until end of turn.",
    },
  ],
});

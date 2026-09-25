import { defineCard } from "../define.js";

export default defineCard({
  name: "Noble Steeds",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "{1}{W}: Target creature gains first strike until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "first-strike", duration: "end-of-turn" },
      resolve: null,
      text: "{1}{W}: Target creature gains first strike until end of turn.",
    },
  ],
});

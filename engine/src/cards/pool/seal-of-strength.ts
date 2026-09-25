import { defineCard } from "../define.js";

export default defineCard({
  name: "Seal of Strength",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Sacrifice this enchantment: Target creature gets +3/+3 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice this enchantment: Target creature gets +3/+3 until end of turn.",
    },
  ],
});

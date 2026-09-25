import { defineCard } from "../define.js";

export default defineCard({
  name: "Captive Flame",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{R}: Target creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: Target creature gets +1/+0 until end of turn.",
    },
  ],
});

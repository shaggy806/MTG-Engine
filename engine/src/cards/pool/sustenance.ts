import { defineCard } from "../define.js";

export default defineCard({
  name: "Sustenance",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "{1}, Sacrifice a land: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: { filter: { type: "land" } } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}, Sacrifice a land: Target creature gets +1/+1 until end of turn.",
    },
  ],
});

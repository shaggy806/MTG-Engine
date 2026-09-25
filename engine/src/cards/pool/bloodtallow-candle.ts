import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodtallow Candle",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{6}, {T}, Sacrifice this artifact: Target creature gets -5/-5 until end of turn.",
  activated: [
    {
      cost: { mana: "{6}", tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -5, toughness: -5, duration: "end-of-turn" },
      resolve: null,
      text: "{6}, {T}, Sacrifice this artifact: Target creature gets -5/-5 until end of turn.",
    },
  ],
});

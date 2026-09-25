import { defineCard } from "../define.js";

export default defineCard({
  name: "Tower of Champions",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{8}, {T}: Target creature gets +6/+6 until end of turn.",
  activated: [
    {
      cost: { mana: "{8}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 6, toughness: 6, duration: "end-of-turn" },
      resolve: null,
      text: "{8}, {T}: Target creature gets +6/+6 until end of turn.",
    },
  ],
});

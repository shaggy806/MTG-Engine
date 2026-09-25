import { defineCard } from "../define.js";

export default defineCard({
  name: "Staff of Zegon",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: Target creature gets -2/-0 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{3}, {T}: Target creature gets -2/-0 until end of turn.",
    },
  ],
});

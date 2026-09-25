import { defineCard } from "../define.js";

export default defineCard({
  name: "Minister of Impediments",
  manaCost: "{2}{W/U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 1,
  toughness: 1,
  text: "({W/U} can be paid with either {W} or {U}.)\n{T}: Tap target creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{T}: Tap target creature.",
    },
  ],
});

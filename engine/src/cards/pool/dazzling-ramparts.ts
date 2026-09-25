import { defineCard } from "../define.js";

export default defineCard({
  name: "Dazzling Ramparts",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 7,
  keywords: ["defender"],
  text: "Defender\n{1}{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{1}{W}, {T}: Tap target creature.",
    },
  ],
});

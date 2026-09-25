import { defineCard } from "../define.js";

export default defineCard({
  name: "Clockwork Drawbridge",
  manaCost: "{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\n{2}{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "{2}{W}, {T}: Tap target creature.",
    },
  ],
});

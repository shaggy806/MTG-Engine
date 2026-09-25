import { defineCard } from "../define.js";

export default defineCard({
  name: "Half-Elf Monk",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Elf", "Monk"],
  power: 1,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\nStunning Strike — {1}{W}, {T}: Tap target creature.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: true },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Stunning Strike — {1}{W}, {T}: Tap target creature.",
    },
  ],
});

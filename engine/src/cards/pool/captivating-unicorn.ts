import { defineCard } from "../define.js";

export default defineCard({
  name: "Captivating Unicorn",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Unicorn"],
  power: 4,
  toughness: 4,
  text: "Constellation — Whenever an enchantment you control enters, tap target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Constellation — Whenever an enchantment you control enters, tap target creature an opponent controls.",
    },
  ],
});

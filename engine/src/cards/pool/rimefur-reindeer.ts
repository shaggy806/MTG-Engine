import { defineCard } from "../define.js";

export default defineCard({
  name: "Rimefur Reindeer",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elk"],
  power: 3,
  toughness: 4,
  text: "Whenever an enchantment you control enters, tap target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Whenever an enchantment you control enters, tap target creature an opponent controls.",
    },
  ],
});

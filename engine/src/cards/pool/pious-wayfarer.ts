import { defineCard } from "../define.js";

export default defineCard({
  name: "Pious Wayfarer",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 1,
  toughness: 2,
  text: "Constellation — Whenever an enchantment you control enters, target creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Constellation — Whenever an enchantment you control enters, target creature gets +1/+1 until end of turn.",
    },
  ],
});

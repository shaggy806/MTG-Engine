import { defineCard } from "../define.js";

export default defineCard({
  name: "Setessan Skirmisher",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 1,
  text: "Constellation — Whenever an enchantment you control enters, this creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Constellation — Whenever an enchantment you control enters, this creature gets +1/+1 until end of turn.",
    },
  ],
});

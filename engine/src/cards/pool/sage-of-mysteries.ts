import { defineCard } from "../define.js";

export default defineCard({
  name: "Sage of Mysteries",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 2,
  text: "Constellation — Whenever an enchantment you control enters, target player mills two cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 2 },
      resolve: null,
      text: "Constellation — Whenever an enchantment you control enters, target player mills two cards.",
    },
  ],
});
